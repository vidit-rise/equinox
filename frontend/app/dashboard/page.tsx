'use client';
import { motion } from 'framer-motion';
import { Activity, Wallet, ArrowUpRight, Loader2, TrendingUp, Coins } from 'lucide-react';
import { useFreighterWallet } from '@/core/hooks/useFreighterWallet';
import { useStellarBalance } from '@/core/hooks/useStellarBalance';
import { useStellarEvents, ContractEvent } from '@/core/hooks/useStellarEvents';
import { AssetAccessCard } from '@/core/components/AssetAccessCard';
import { MobileNavigation } from '@/core/components/MobileNavigation';
import { stagger } from '@/core/lib/motionPresets';

const EVENT_COLORS: Record<ContractEvent['type'], string> = {
  mint:      '#16a34a',
  burn:      '#dc2626',
  swap:      '#2563eb',
  liquidity: '#9333ea',
  trustline: '#d97706',
  fee:       '#db2777',
};

const EventRow = ({ event }: { event: ContractEvent }) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderBottom: '1px solid var(--card-border)',
    }}
  >
    <div style={{
      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
      background: `${EVENT_COLORS[event.type]}10`,
      border: `1px solid ${EVENT_COLORS[event.type]}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: EVENT_COLORS[event.type], textTransform: 'uppercase' }}>
        {event.type.slice(0, 3)}
      </span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: 14, color: 'var(--foreground)' }}>{event.type}</span>
        <span style={{
          background: `${EVENT_COLORS[event.type]}12`, color: EVENT_COLORS[event.type],
          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
        }}>
          {parseFloat(event.amount || '0').toLocaleString(undefined, { maximumFractionDigits: 4 })} SST
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
        {event.from ? `${event.from.slice(0, 8)}…${event.from.slice(-4)}` : '—'}
      </div>
    </div>
    <a
      href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
      target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--muted)', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <ArrowUpRight size={14} />
    </a>
  </motion.div>
);

export default function DashboardPage() {
  const { isConnected, connect, publicKey, network } = useFreighterWallet();
  const { sstBalance, xlmBalance, isLoading: balLoading } = useStellarBalance(publicKey);
  const { events, isLoading: eventsLoading } = useStellarEvents();

  if (!isConnected) {
    return (
      <main style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 24,
        background: 'var(--background)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'var(--muted-bg)', border: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wallet size={32} style={{ color: 'var(--muted)' }} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Connect Your Wallet</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Connect your Freighter wallet to view balances, trustline status, and live transaction activity.
          </p>
        </div>
        <button
          id="dashboard-connect-btn"
          className="btn-primary"
          onClick={connect}
          style={{ minHeight: 48, padding: '14px 32px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Wallet size={18} /> Connect Freighter
        </button>
        <MobileNavigation />
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px 16px 100px', background: 'var(--background)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Page header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'var(--foreground)' }}>Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'monospace' }}>
                {publicKey.slice(0, 8)}…{publicKey.slice(-8)} · {network}
              </span>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid-layout" style={{ padding: 0, marginBottom: 24 }}>
            {/* SST Balance */}
            <motion.div {...stagger(0)} className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Coins size={16} style={{ color: '#4f46e5' }} />
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>SST Balance</p>
              </div>
              {balLoading ? (
                <Loader2 size={20} style={{ color: 'var(--muted)', animation: 'spin 1s linear infinite' }} />
              ) : (
                <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--foreground)' }}>
                  {parseFloat(sstBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  <span style={{ fontSize: 15, color: 'var(--muted)', marginLeft: 8 }}>SST</span>
                </p>
              )}
            </motion.div>

            {/* XLM Balance */}
            <motion.div {...stagger(1)} className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={16} style={{ color: '#2563eb' }} />
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>XLM Balance</p>
              </div>
              {balLoading ? (
                <Loader2 size={20} style={{ color: 'var(--muted)', animation: 'spin 1s linear infinite' }} />
              ) : (
                <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--foreground)' }}>
                  {parseFloat(xlmBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  <span style={{ fontSize: 15, color: 'var(--muted)', marginLeft: 8 }}>XLM</span>
                </p>
              )}
            </motion.div>

            {/* Network */}
            <motion.div {...stagger(2)} className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Activity size={16} style={{ color: 'var(--success)' }} />
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>Network</p>
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{network}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Stellar Testnet · Soroban</p>
            </motion.div>
          </div>

          {/* Trustline / Asset Access */}
          <div style={{ marginBottom: 24 }}>
            <AssetAccessCard publicKey={publicKey} />
          </div>

          {/* Live Events Feed */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 20px', borderBottom: '1px solid var(--card-border)',
            }}>
              <Activity size={16} style={{ color: 'var(--foreground)' }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>Live Transaction Feed</span>
              <div style={{
                marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                background: 'var(--success)', animation: 'pulse 2s infinite',
              }} />
            </div>
            {eventsLoading ? (
              <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={24} style={{ color: 'var(--muted)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : events.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                No recent on-chain events
              </div>
            ) : (
              events.slice(0, 15).map((e) => <EventRow key={e.id} event={e} />)
            )}
          </div>

        </motion.div>
      </div>
      <MobileNavigation />
    </main>
  );
}
