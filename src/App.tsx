import { useState, type FormEvent } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { prepareTransfer, type Network } from './transfer';
import { Swap } from './Swap';

const DEVELOPER_ADDRESS = 'UQDk-1Gqc4YIC22LTAAZLxomhkyp-V52B0yaeHgmk3t9Lli6';

export function App() {
  const wallet = useTonWallet();
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [network, setNetwork] = useState<Network>('testnet');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setStatus('');
    try {
      if (!wallet) throw new Error('Connect a wallet first');
      if (wallet.account.chain !== (network === 'mainnet' ? '-239' : '-3')) {
        throw new Error('Selected network does not match your connected wallet');
      }
      const message = prepareTransfer(recipient, amount, network);
      setBusy(true);
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        network: wallet.account.chain,
        from: wallet.account.address,
        messages: [message],
      });
      setStatus('Wallet submitted the request. Check a block explorer for final transaction status.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Wallet request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <header>
        <div><p className="eyebrow">TON blockchain</p><h1>TON-Coin</h1></div>
        <TonConnectButton />
      </header>
      <section>
        <h2>Wallet</h2>
        <p>{address ? `Connected: ${address}` : 'Connect a TON wallet to prepare a transfer.'}</p>
        <p>Developer reference address: <span className="address">{DEVELOPER_ADDRESS}</span></p>
        <p className="notice">The developer address is informational; no ownership or authorization is implied.</p>
      </section>
      <section>
        <h2>Send TON</h2>
        <p>Review the recipient and amount carefully. Your wallet must approve the request.</p>
        <form onSubmit={send}>
          <label>Network
            <select value={network} onChange={(event) => setNetwork(event.target.value as Network)} disabled={busy}>
              <option value="testnet">Testnet</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </label>
          <label>Recipient address
            <input value={recipient} onChange={(event) => setRecipient(event.target.value)} required disabled={busy} autoComplete="off" />
          </label>
          <label>Amount in TON
            <input value={amount} onChange={(event) => setAmount(event.target.value)} required disabled={busy} inputMode="decimal" placeholder="0.1" />
          </label>
          <button type="submit" disabled={!wallet || busy}>{busy ? 'Waiting for wallet…' : 'Review in wallet'}</button>
        </form>
        <p role="status" aria-live="polite">{status}</p>
      </section>
      {import.meta.env.VITE_ENABLE_EXPERIMENTAL_SWAPS === 'true' && <Swap />}
      <section>
        <h2>Project status</h2>
        <p>The Jetton contracts are an unaudited starter and are not integrated into this app. Staking, mining, and autonomous agent transactions are not implemented.</p>
      </section>
    </main>
  );
}
