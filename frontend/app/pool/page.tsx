'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, MinusCircle, Loader2, Droplets, ExternalLink } from 'lucide-react';
import { useFreighterWallet } from '@/core/hooks/useFreighterWallet';
import { useStellarBalance } from '@/core/hooks/useStellarBalance';
import { usePoolMetrics } from '@/core/hooks/usePoolMetrics';
import { POOL_CONTRACT, SOROBAN_RPC_URL, NETWORK_PASSPHRASE } from '@/core/lib/networkConfig';
import { MobileNavigation } from '@/core/components/MobileNavigation';

export default function PoolPage() {
  const { isConnected, connect, publicKey } = useFreighterWallet();
  const { sstBalance, xlmBalance, mutate: mutateSST } = useStellarBalance(publicKey);
  const { tvl, xlmReserve, sstReserve, apy, isLoading, mutate: mutatePool } = usePoolMetrics();
  const [tab, setTab] = useState<'add' | 'remove'>('add');
  const [sstAmt, setSstAmt] = useState('');
  const [xlmAmt, setXlmAmt] = useState('');
  const [lpAmt, setLpAmt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState('');
  const [error, setError] = useState('');

  const sstReserveNum = parseFloat(sstReserve) || 1;
  const xlmReserveNum = parseFloat(xlmReserve) || 1;
  const ratio = xlmReserveNum / sstReserveNum;

  const handleSstChange = (v: string) => {
    setSstAmt(v);
    if (v) setXlmAmt((parseFloat(v) * ratio).toFixed(6));
  };

  const submit = async () => {
    setError('');
    if (!isConnected || !publicKey) return connect();
    if (tab === 'add' && (!sstAmt || parseFloat(sstAmt) <= 0)) {
      setError('Enter an SST amount to add');
      return;
    }
    if (tab === 'remove' && (!lpAmt || parseFloat(lpAmt) <= 0)) {
      setError('Enter an LP token amount to remove');
      return;
    }

    setIsSubmitting(true);
    setSuccessTxHash('');

    try {
      const { Contract, nativeToScVal, Address, TransactionBuilder, Horizon, rpc } =
        await import('@stellar/stellar-sdk');
      const { signTransaction } = await import('@stellar/freighter-api');

      const server   = new rpc.Server(SOROBAN_RPC_URL, { allowHttp: true });
      const contract = new Contract(POOL_CONTRACT);

      let operation;
      if (tab === 'add') {
        const sstStroops = Math.floor(parseFloat(sstAmt) * 1e7);
        const xlmStroops = Math.floor(parseFloat(xlmAmt) * 1e7);
        operation = contract.call(
          'add_liquidity',
          new Address(publicKey).toScVal(),
          nativeToScVal(sstStroops, { type: 'i128' }),
          nativeToScVal(xlmStroops, { type: 'i128' })
        );
      } else {
        const lpStroops = Math.floor(parseFloat(lpAmt) * 1e7);
        operation = contract.call(
          'remove_liquidity',
          new Address(publicKey).toScVal(),
          nativeToScVal(lpStroops, { type: 'i128' })
        );
      }

      const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
      const account = await horizon.loadAccount(publicKey);

      let tx = new TransactionBuilder(account, {
        fee: '10000',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(180)
        .build();

      tx = await server.prepareTransaction(tx);
      const signedResult = await signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
      const signedXDR = typeof signedResult === 'string'
        ? signedResult
        : (signedResult as any)?.signedTxXdr ?? '';
      if (!signedXDR) throw new Error('Freighter did not return a signed transaction.');

      const signedTx = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
      const response = await server.sendTransaction(signedTx);

      if (response.status === 'ERROR') throw new Error('Transaction submission failed.');

      setSuccessTxHash(response.hash);
      setSstAmt(''); setXlmAmt(''); setLpAmt('');

      await new Promise(r => setTimeout(r, 4000));
      await mutateSST();
      await mutatePool();
    } catch (e: any) {
      console.error('Pool error:', e);
      setError(e.message || String(e) || 'Transaction failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = { fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8, display: 'block' };
  const inputStyle = {
    width: '100%', background: 'var(--muted-bg)',
    border: '1px solid transparent', borderRadius: 8,
    padding: '14px 16px', fontSize: 18, color: 'var(--foreground)',
    outline: 'none', fontWeight: 600, transition: 'all 0.15s',
  };

  return (
    <main style={{ minHeight: '100vh', padding: '40px 16px 100px', maxWidth: 560, margin: '0 auto', background: 'var(--background)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: 'var(--foreground)' }}>Liquidity Pool</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            Provide SST + XLM and earn <strong style={{ color: 'var(--foreground)' }}>{apy}% APY</strong>
          </p>
        </div>

        {/* Pool Stats */}
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Droplets size={16} style={{ color: 'var(--muted)' }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>Pool Reserves</span>
          </div>
          {[
            { label: 'Total Value Locked', value: `$${parseFloat(tvl).toLocaleString()}` },
            { label: 'SST Reserve', value: `${parseFloat(sstReserve).toLocaleString(undefined, { maximumFractionDigits: 2 })} SST` },
            { label: 'XLM Reserve', value: `${parseFloat(xlmReserve).toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM` },
          ].map(({ label, value }, i, arr) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--card-border)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--muted-bg)', padding: 4, borderRadius: 10, border: '1px solid var(--card-border)' }}>
          {(['add', 'remove'] as const).map((t) => (
            <button
              key={t}
              id={`pool-tab-${t}-btn`}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8,
                cursor: 'pointer', fontWeight: 600, fontSize: 14, minHeight: 40,
                background: tab === t ? 'var(--card-bg)' : 'transparent',
                color: tab === t ? 'var(--foreground)' : 'var(--muted)',
                border: tab === t ? '1px solid var(--card-border)' : '1px solid transparent',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {t === 'add'
                ? <><PlusCircle size={15} />Add Liquidity</>
                : <><MinusCircle size={15} />Remove Liquidity</>}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
            {tab === 'add' ? (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={labelStyle}>SST Amount</label>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                      Bal: {parseFloat(sstBalance).toFixed(4)}
                    </span>
                  </div>
                  <input
                    id="pool-sst-input"
                    type="number" placeholder="0.00" value={sstAmt}
                    onChange={(e) => handleSstChange(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={labelStyle}>XLM Amount</label>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                      Bal: {parseFloat(xlmBalance).toFixed(4)}
                    </span>
                  </div>
                  <input
                    id="pool-xlm-input"
                    type="number" placeholder="0.00" value={xlmAmt}
                    onChange={(e) => {
                      setXlmAmt(e.target.value);
                      if (e.target.value) setSstAmt((parseFloat(e.target.value) / ratio).toFixed(6));
                    }}
                    style={inputStyle}
                  />
                </div>
                {sstAmt && (
                  <div style={{
                    background: 'var(--muted-bg)', borderRadius: 8, padding: '10px 14px',
                    fontSize: 13, color: 'var(--muted)', border: '1px solid var(--card-border)',
                  }}>
                    Current ratio: 1 SST = <strong style={{ color: 'var(--foreground)' }}>{ratio.toFixed(4)} XLM</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card">
                <label style={labelStyle}>LP Token Amount</label>
                <input
                  id="pool-lp-input"
                  type="number" placeholder="0.00" value={lpAmt}
                  onChange={(e) => setLpAmt(e.target.value)}
                  style={inputStyle}
                />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
                  Enter the number of LP tokens to burn and receive proportional SST + XLM back.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Submit */}
        <button
          id="pool-submit-btn"
          className="btn-primary"
          onClick={submit}
          disabled={isSubmitting}
          style={{ width: '100%', marginTop: 16, fontSize: 15, minHeight: 52 }}
        >
          {isSubmitting
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
            : isConnected
              ? (tab === 'add' ? 'Add Liquidity' : 'Remove Liquidity')
              : 'Connect Wallet'}
        </button>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                marginTop: 10, padding: 12, borderRadius: 8,
                background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)',
                fontSize: 13, color: 'var(--error)', textAlign: 'center', fontWeight: 500,
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {successTxHash && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                marginTop: 10, padding: 12, borderRadius: 8,
                background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.25)',
                fontSize: 13, color: 'var(--success)', textAlign: 'center', fontWeight: 500,
              }}
            >
              <div style={{ marginBottom: 6 }}>✓ {tab === 'add' ? 'Liquidity added' : 'Liquidity removed'}</div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${successTxHash}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'inherit', fontFamily: 'monospace', fontSize: 12 }}
              >
                {successTxHash.slice(0, 20)}… <ExternalLink size={11} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
      <MobileNavigation />
    </main>
  );
}
