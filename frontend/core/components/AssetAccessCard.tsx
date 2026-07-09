'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Link2, RefreshCw, Coins } from 'lucide-react';
import { useStellarTrustline } from '@/core/hooks/useStellarTrustline';
import { successPop } from '@/core/lib/motionPresets';
import { useState } from 'react';
import useSWR from 'swr';

export function AssetAccessCard({ publicKey }: { publicKey: string }) {
  const { hasTrustline, sstBalance, sstLimit, isLoading, isAdding, addTrustline } =
    useStellarTrustline(publicKey);
  const { isValidating } = useSWR(publicKey ? `/api/balance/${publicKey}` : null);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = async () => {
    await addTrustline();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 5000);
  };

  if (isLoading) {
    return (
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RefreshCw size={16} style={{ color: 'var(--muted)', animation: 'spin 0.9s linear infinite' }} />
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>Checking trustline…</span>
      </div>
    );
  }

  if (!hasTrustline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          borderColor: 'rgba(217,119,6,0.4)',
          background: 'rgba(217,119,6,0.03)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={16} style={{ color: 'var(--warning)', marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 4, fontSize: 14 }}>
              No SST Trustline
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Your wallet has no SST trustline. Add it to receive Stellar Swap Tokens.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="btn-primary"
              onClick={handleAdd}
              disabled={isAdding}
              style={{
                minHeight: 44, display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', fontSize: 14,
                background: 'var(--warning)',
                border: '1px solid var(--warning)',
              }}
            >
              {isAdding
                ? <><RefreshCw size={14} style={{ animation: 'spin 0.9s linear infinite' }} /> Adding…</>
                : <><Link2 size={14} /> Add Trustline</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {justAdded ? (
        <motion.div
          key="success"
          variants={successPop}
          initial="hidden" animate="visible" exit="exit"
          className="glass-card"
          style={{
            borderColor: 'rgba(22,163,74,0.4)',
            background: 'rgba(22,163,74,0.04)',
            textAlign: 'center',
          }}
        >
          <CheckCircle2 size={36} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 700, color: 'var(--success)', fontSize: 16 }}>Trustline Added!</p>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            You can now receive SST tokens.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="active"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            borderColor: 'rgba(22,163,74,0.3)',
            background: 'rgba(22,163,74,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: 14 }}>
              Trustline active
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>
              Limit: {parseFloat(sstLimit).toLocaleString()} SST
            </span>
            <RefreshCw
              size={12}
              style={{
                color: isValidating ? 'var(--muted)' : 'transparent',
                animation: isValidating ? 'spin 0.9s linear infinite' : 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Coins size={16} style={{ color: 'var(--muted)' }} />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>SST Balance</span>
            </div>
            <motion.span
              key={sstBalance}
              initial={{ opacity: 0.4, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)' }}
            >
              {parseFloat(sstBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 6 }}>SST</span>
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
