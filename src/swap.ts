import { StonApiClient, type SwapSimulation } from '@ston-fi/api';
import { dexFactory } from '@ston-fi/sdk';
import { Address, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';

const TON = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
const QUOTE_LIFETIME_MS = 30_000;

export function swapInputs(jetton: string, amount: string) {
  const parsed = Address.parseFriendly(jetton.trim());
  if (parsed.isTestOnly) throw new Error('The Jetton must be a mainnet address');
  if (!/^(0|[1-9]\d*)(\.\d{1,9})?$/.test(amount)) {
    throw new Error('Enter a TON amount with at most 9 decimal places');
  }
  const units = toNano(amount);
  if (units <= 0n || units >= 1n << 120n) throw new Error('Invalid TON amount');
  return { jetton: parsed.address.toRawString(), units: units.toString() };
}

export function validateQuote(quote: SwapSimulation, jetton: string, units: string) {
  if (
    !Address.parse(quote.offerAddress).equals(Address.parse(TON)) ||
    !Address.parse(quote.askAddress).equals(Address.parse(jetton)) ||
    quote.offerUnits !== units ||
    !/^0\.010*$/.test(quote.slippageTolerance) ||
    !/^[1-9]\d*$/.test(quote.minAskUnits) ||
    !/^[1-9]\d*$/.test(quote.askUnits) ||
    BigInt(quote.minAskUnits) > BigInt(quote.askUnits) ||
    BigInt(quote.minAskUnits) < (BigInt(quote.askUnits) * 99n) / 100n ||
    !Address.parse(quote.routerAddress).equals(Address.parse(quote.router.address))
  ) throw new Error('The DEX returned an inconsistent quote');
}

export async function quoteSwap(jetton: string, amount: string) {
  const input = swapInputs(jetton, amount);
  const simulation = await new StonApiClient().simulateSwap({
    offerAddress: TON,
    askAddress: input.jetton,
    offerUnits: input.units,
    slippageTolerance: '0.01',
    dexV2: true,
  });
  validateQuote(simulation, input.jetton, input.units);
  return { simulation, createdAt: Date.now(), input };
}

export type Quote = Awaited<ReturnType<typeof quoteSwap>>;

export async function buildSwap(quote: Quote, wallet: string) {
  if (Date.now() - quote.createdAt >= QUOTE_LIFETIME_MS) throw new Error('Quote expired; request a new quote');
  validateQuote(quote.simulation, quote.input.jetton, quote.input.units);
  const contracts = dexFactory(quote.simulation.router);
  const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
  const router = client.open(contracts.Router.create(quote.simulation.router.address));
  const tx = await router.getSwapTonToJettonTxParams({
    userWalletAddress: wallet,
    offerAmount: quote.simulation.offerUnits,
    minAskAmount: quote.simulation.minAskUnits,
    askJettonAddress: quote.simulation.askAddress,
    proxyTon: contracts.pTON.create(quote.simulation.router.ptonMasterAddress),
    forwardGasAmount: quote.simulation.gasParams.forwardGas,
  });
  if (Date.now() - quote.createdAt >= QUOTE_LIFETIME_MS) throw new Error('Quote expired; request a new quote');
  return { address: tx.to.toString(), amount: tx.value.toString(), payload: tx.body?.toBoc().toString('base64') };
}
