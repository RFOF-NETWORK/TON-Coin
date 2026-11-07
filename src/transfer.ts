import { Address, toNano } from '@ton/core';

export type Network = 'mainnet' | 'testnet';

export function prepareTransfer(recipient: string, amount: string, network: Network) {
  const trimmed = recipient.trim();
  let address: Address;
  try {
    if (trimmed.includes(':')) {
      address = Address.parseRaw(trimmed);
    } else {
      const friendly = Address.parseFriendly(trimmed);
      if (network === 'mainnet' && friendly.isTestOnly) {
        throw new Error('A testnet-only address cannot be used on mainnet');
      }
      address = friendly.address;
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'A testnet-only address cannot be used on mainnet') throw error;
    throw new Error('Enter a valid TON address');
  }
  if (!/^(0|[1-9]\d*)(\.\d{1,9})?$/.test(amount)) {
    throw new Error('Enter a TON amount with at most 9 decimal places');
  }
  const nano = toNano(amount);
  if (nano <= 0n || nano >= 1n << 120n) {
    throw new Error('Amount must be positive and fit in a TON coin value');
  }
  return {
    address: address.toString({ bounceable: trimmed.includes(':') ? true : Address.parseFriendly(trimmed).isBounceable, testOnly: network === 'testnet' }),
    amount: nano.toString(),
  };
}
