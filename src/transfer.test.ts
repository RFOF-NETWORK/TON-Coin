import { describe, expect, it } from 'vitest';
import { Address } from '@ton/core';
import { prepareTransfer } from './transfer';

const raw = '0:0000000000000000000000000000000000000000000000000000000000000001';
const address = Address.parseRaw(raw);

describe('prepareTransfer', () => {
  it('converts an exact decimal and preserves a non-bounceable address', () => {
    const recipient = address.toString({ bounceable: false });
    expect(prepareTransfer(recipient, '1.000000001', 'mainnet')).toEqual({
      address: recipient,
      amount: '1000000001',
    });
  });
  it('marks testnet addresses and defaults raw addresses to bounceable', () => {
    const result = prepareTransfer(raw, '0.1', 'testnet');
    expect(Address.parseFriendly(result.address)).toMatchObject({ isTestOnly: true, isBounceable: true });
    expect(result.amount).toBe('100000000');
  });
  it('rejects a testnet-only address on mainnet', () => {
    expect(() => prepareTransfer(address.toString({ testOnly: true }), '1', 'mainnet')).toThrow('testnet-only');
  });
  it.each(['0', '-1', '1e3', '.1', '01', '1.0000000001', 'abc', ''])('rejects invalid amount %s', (amount) => {
    expect(() => prepareTransfer(raw, amount, 'testnet')).toThrow();
  });
  it('rejects malformed addresses', () => {
    expect(() => prepareTransfer('not-an-address', '1', 'testnet')).toThrow('valid TON address');
  });
  it('rejects amounts exceeding the coin serialization limit', () => {
    expect(() => prepareTransfer(raw, (1n << 120n).toString(), 'testnet')).toThrow();
  });
});
