'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Loader2, ExternalLink } from 'lucide-react';
import { useFreighterWallet } from '@/core/hooks/useFreighterWallet';
import { useStellarBalance } from '@/core/hooks/useStellarBalance';
import { useTokenPricing } from '@/core/hooks/useTokenPricing';
import { displayQuote } from '@/core/lib/ammPricing';
import { POOL_CONTRACT, TOKEN_CONTRACT, XLM_CONTRACT, SOROBAN_RPC_URL, NETWORK_PASSPHRASE } from '@/core/lib/networkConfig';
import { MobileNavigation } from '@/core/components/MobileNavigation';

type TokenDir = 'SST_TO_XLM' | 'XLM_TO_SST';

export default function SwapPage() {
  const { isConnected, connect, publicKey } = useFreighterWallet();
  const { sstBalance, xlmBalance, mutate } = useStellarBalance(publicKey);
  const { price } = useTokenPricing();
  const [dir, setDir] = useState<TokenDir>('SST_TO_XLM');
  const [amountIn, setAmountIn] = useState('');
  const [slippage] = useState('0.5');
  const [isSwapping, setIsSwapping] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const flip = () => setDir((d) => (d === 'SST_TO_XLM' ? 'XLM_TO_SST' : 'SST_TO_XLM'));
  const fromToken = dir === 'SST_TO_XLM' ? 'SST' : 'XLM';
  const toToken   = dir === 'SST_TO_XLM' ? 'XLM' : 'SST';
  const fromBalance = dir === 'SST_TO_XLM' ? sstBalance : xlmBalance;
  const priceVal  = parseFloat(price) || 0.05;
  const amountOut = displayQuote(priceVal, amountIn, dir);

  const doSwap = async () => {
    setError('');
    // Error state 1: wallet not connected → trigger Freighter connect flow
    if (!isConnected || !publicKey) return connect();
    // Error state 2: invalid/empty amount
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setError('Enter an amount to swap');
      return;
    }
    // Error state 3: insufficient balance (pre-tx check)
    if (parseFloat(amountIn) > parseFloat(fromBalance)) {
      setError(`Insufficient ${fromToken} balance`);
      return;
    }
    setIsSwapping(true);
    setTxHash('');

    try {
      const { Contract, nativeToScVal, Address, TransactionBuilder, Horizon, rpc } =
        await import('@stellar/stellar-sdk');
      const { signTransaction } = await import('@stellar/freighter-api');

      const server   = new rpc.Server(SOROBAN_RPC_URL, { allowHttp: true });
      const contract = new Contract(POOL_CONTRACT);
      const tokenInId = dir === 'SST_TO_XLM' ? TOKEN_CONTRACT : XLM_CONTRACT;
      const amountInStroops = Math.floor(parseFloat(amountIn) * 1e7);

      const swapOp = contract.call(
        'swap',
        new Address(publicKey).toScVal(),
        new Address(tokenInId).toScVal(),
        nativeToScVal(amountInStroops, { type: 'i128' })
      );

      const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
      const account = await horizon.loadAccount(publicKey);
      let tx = new TransactionBuilder(account, {
        fee: '10000',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(swapOp)
        .setTimeout(180)
        .build();

      tx = await server.prepareTransaction(tx);
      const signedResult = await signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
      const signedXDR = typeof signedResult === 'string'
        ? signedResult
        : (signedResult as any)?.signedTxXdr ?? '';

      // Error state 4: user rejected signature in wallet
      if (!signedXDR) throw new Error('Transaction rejected in wallet');

      const signedTx = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
      const response = await server.sendTransaction(signedTx);

      if (response.status === 'ERROR') throw new Error('Transaction submission failed.');

      setTxHash(response.hash);
      await new Promise(r => setTimeout(r, 4000));
      await mutate();
    } catch (e: any) {
      console.error('Swap error:', e);
      setError(e?.message || String(e) || 'Swap failed. Try again.');
    } finally {
      setIsSwapping(false);
      setAmountIn('');
    }
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '40px 16px 100px',
      background: 'var(--background)',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--foreground)', marginBottom: 4 }}>Swap</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>SST ↔ XLM · Constant-product AMM</p>
          </div>

          {/* Swap card */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>

            {/* From */}
            <div style={{ padding: 20, borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</span>
                <button
                  onClick={() => setAmountIn(parseFloat(fromBalance).toFixed(6))}
                  style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                >
                  Bal: {parseFloat(fromBalance).toFixed(4)} {fromToken}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  id="swap-amount-input"
                  type="number"
                  placeholder="0.00"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 32, fontWeight: 700, color: 'var(--foreground)', width: '100%',
                  }}
                />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--muted-bg)', border: '1px solid var(--card-border)',
                  padding: '8px 14px', borderRadius: 8, whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>{fromToken}</span>
                </div>
              </div>
            </div>

            {/* Flip arrow */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0', background: 'var(--muted-bg)' }}>
              <motion.button
                id="swap-flip-btn"
                whileTap={{ rotate: 180 }}
                onClick={flip}
                style={{
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  borderRadius: '50%', padding: 10, cursor: 'pointer', color: 'var(--foreground)',
                  minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <ArrowLeftRight size={18} />
              </motion.button>
            </div>

            {/* To */}
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>To (estimated)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  flex: 1, fontSize: 32, fontWeight: 700,
                  color: amountOut ? 'var(--foreground)' : '#d4d4d8',
                }}>
                  {amountOut || '0.00'}
                </span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--muted-bg)', border: '1px solid var(--card-border)',
                  padding: '8px 14px', borderRadius: 8,
                }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>{toToken}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rate info row */}
          <AnimatePresence>
            {amountIn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  marginTop: 8, padding: '12px 16px',
                  background: 'var(--muted-bg)', border: '1px solid var(--card-border)',
                  borderRadius: 8, fontSize: 13,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--muted)' }}>Rate</span>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                      1 {fromToken} = {dir === 'SST_TO_XLM' ? priceVal.toFixed(6) : (1 / priceVal).toFixed(6)} {toToken}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Slippage tolerance</span>
                    <span style={{ fontWeight: 600, color: 'var(--warning)' }}>{slippage}%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swap button */}
          <button
            id="swap-submit-btn"
            className="btn-primary"
            onClick={doSwap}
            disabled={isSwapping}
            style={{ width: '100%', marginTop: 12, fontSize: 16, minHeight: 52 }}
          >
            {isSwapping
              ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Swapping…</>
              : isConnected ? 'Swap' : 'Connect Wallet to Swap'}
          </button>

          {/* Error state */}
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

          {/* Success state */}
          <AnimatePresence>
            {txHash && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  marginTop: 10, padding: 12, borderRadius: 8,
                  background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.25)',
                  fontSize: 13, color: 'var(--success)', textAlign: 'center', fontWeight: 500,
                }}
              >
                <div style={{ marginBottom: 6 }}>✓ Swap complete</div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'inherit', fontFamily: 'monospace', fontSize: 12 }}
                >
                  {txHash.slice(0, 20)}… <ExternalLink size={11} />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <MobileNavigation />
    </main>
  );
}
