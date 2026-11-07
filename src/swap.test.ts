import { describe, expect, it } from 'vitest';
import { Address } from '@ton/core';
import type { SwapSimulation } from '@ston-fi/api';
import { buildSwap, swapInputs, validateQuote } from './swap';

const ton = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
const jetton = Address.parseRaw(`0:${'01'.repeat(32)}`).toString();
const router = Address.parseRaw(`0:${'02'.repeat(32)}`).toString();
const sample: SwapSimulation = {
  askAddress: jetton, askJettonWallet: jetton, askUnits: '10000',
  feeAddress: jetton, feePercent: '0.003', feeUnits: '30',
  minAskUnits: '9900', offerAddress: ton, offerJettonWallet: router,
  offerUnits: '1000000000', poolAddress: router, priceImpact: '0.01',
  routerAddress: router, router: {
    address: router, majorVersion: 2, minorVersion: 1, ptonMasterAddress: router,
    ptonVersion: '2', ptonWalletAddress: router, routerType: 'constant_product',
    poolCreationEnabled: true,
  },
  slippageTolerance: '0.01', swapRate: '1', recommendedSlippageTolerance: '0.01',
  recommendedMinAskUnits: '9900', gasParams: { forwardGas: '100000000', estimatedGasConsumption: '1' },
};

describe('swap safeguards', () => {
  it('validates input and matching quote', () => {
    const input = swapInputs(jetton, '1');
    expect(input.units).toBe('1000000000');
    expect(() => validateQuote(sample, input.jetton, input.units)).not.toThrow();
  });
  it('rejects testnet addresses and invalid amounts', () => {
    expect(() => swapInputs(Address.parse(jetton).toString({ testOnly: true }), '1')).toThrow();
    expect(() => swapInputs(jetton, '1.0000000001')).toThrow();
    expect(() => swapInputs(jetton, '0')).toThrow();
  });
  it('rejects inconsistent quotes and excessive slippage', () => {
    for (const quote of [
      { ...sample, offerUnits: '2' },
      { ...sample, minAskUnits: '1' },
      { ...sample, routerAddress: jetton },
      { ...sample, askAddress: router },
    ]) expect(() => validateQuote(quote, jetton, '1000000000')).toThrow();
  });
  it('rejects an expired quote before network calls', async () => {
    await expect(buildSwap({
      simulation: sample,
      createdAt: Date.now() - 30000,
      input: { jetton, units: '1000000000' },
    }, router)).rejects.toThrow('expired');
  });
});
