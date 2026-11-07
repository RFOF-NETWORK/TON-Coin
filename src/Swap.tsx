import { useState, type FormEvent } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { buildSwap, quoteSwap, type Quote } from './swap';

export function Swap() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [jetton, setJetton] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const isMainnet = wallet?.account.chain === '-239';

  async function getQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setQuote(null);
    setStatus('');
    try {
      if (!isMainnet) throw new Error('Connect a mainnet wallet to request a quote');
      setQuote(await quoteSwap(jetton, amount));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Quote failed');
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (busy || !quote || !wallet || !isMainnet) return;
    setBusy(true);
    setStatus('');
    try {
      const sender = wallet.account.address;
      const message = await buildSwap(quote, sender);
      if (tonConnectUI.account?.address !== sender || tonConnectUI.account.chain !== '-239') {
        throw new Error('Wallet or network changed; request a new quote');
      }
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor((quote.createdAt + 30_000) / 1000),
        network: '-239',
        from: sender,
        messages: [message],
      });
      setQuote(null);
      setStatus('Wallet submitted the request. Check the complete swap trace for settlement or refunds.');
    } catch (error) {
      setQuote(null);
      setStatus(error instanceof Error ? error.message : 'Swap request failed');
    } finally {
      setBusy(false);
    }
  }

  return <section>
    <h2>TON to Jetton swap</h2>
    <p>Experimental mainnet integration with STON.fi. Verify the Jetton master address: anyone can issue a token with a misleading name. Quotes expire after 30 seconds; slippage is fixed at 1%.</p>
    <form onSubmit={getQuote}>
      <label>Jetton master address<input value={jetton} onChange={(e) => { setJetton(e.target.value); setQuote(null); }} disabled={busy} required /></label>
      <label>Amount in TON<input value={amount} onChange={(e) => { setAmount(e.target.value); setQuote(null); }} inputMode="decimal" disabled={busy} required /></label>
      <button disabled={busy || !isMainnet}>Get quote</button>
    </form>
    {quote && <div>
      <p>Expected: {quote.simulation.askUnits} base units. Minimum: {quote.simulation.minAskUnits} base units. Price impact: {quote.simulation.priceImpact}. DEX fee: {quote.simulation.feeUnits} base units. Network fees are additional.</p>
      <p>Router: {quote.simulation.router.address}</p>
      <button type="button" disabled={busy || !isMainnet} onClick={send}>Review swap in wallet</button>
    </div>}
    <p role="status" aria-live="polite">{status}</p>
  </section>;
}
