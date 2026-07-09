'use client';
import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ExternalLink, RefreshCw } from 'lucide-react';
import { useStellarEvents, ContractEvent } from '@/core/hooks/useStellarEvents';
import { SkeletonText } from '@/core/components/VisualSkeleton';
import { slideIn } from '@/core/lib/motionPresets';
import useSWR from 'swr';

const BORDER_COLORS: Record<ContractEvent['type'], string> = {
  mint:      '#16a34a',
  burn:      '#dc2626',
  swap:      '#2563eb',
  liquidity: '#9333ea',
  trustline: '#d97706',
  fee:       '#db2777',
};

const LABELS: Record<ContractEvent['type'], string> = {
  mint: 'Mint', burn: 'Burn', swap: 'Swap',
  liquidity: 'Liquidity', trustline: 'Trustline', fee: 'Fee',
};

const EventRow = memo(function EventRow({ event, index }: { event: ContractEvent; index: number }) {
  const color = BORDER_COLORS[event.type];
  return (
    <motion.div
      layout
      {...slideIn}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 16px',
        borderLeft: `3px solid ${color}`,
        borderBottom: '1px solid var(--card-border)',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${color}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' }}>
          {event.type.slice(0, 3)}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--foreground)' }}>{LABELS[event.type]}</span>
          <span style={{
            background: `${color}18`, color,
            padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          }}>
            {parseFloat(event.amount || '0').toLocaleString(undefined, { maximumFractionDigits: 4 })} SST
          </span>
        </div>
        <p style={{
          fontSize: 11, color: 'var(--muted)', marginTop: 2,
          fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {event.from ? `${event.from.slice(0, 8)}…${event.from.slice(-4)}` : '—'}
          {' · '}
          {new Date(event.timestamp).toLocaleTimeString()}
        </p>
      </div>

      <a
        href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
        target="_blank" rel="noopener noreferrer"
        title="View on Stellar Expert"
        style={{
          color: 'var(--muted)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44,
        }}
      >
        <ExternalLink size={13} />
      </a>
    </motion.div>
  );
});

export const OnChainEventFeed = memo(function OnChainEventFeed() {
  const { events, isLoading, isError } = useStellarEvents();
  const { isValidating } = useSWR('/api/events');

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 18px', borderBottom: '1px solid var(--card-border)',
      }}>
        <Activity size={16} style={{ color: 'var(--foreground)' }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>Live Transaction Feed</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw
            size={14}
            style={{
              color: isValidating ? 'var(--accent)' : 'var(--muted)',
              animation: isValidating ? 'spin 0.9s linear infinite' : 'none',
              transition: 'color 0.2s',
            }}
          />
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--success)', animation: 'pulse 2s infinite',
          }} />
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ padding: '14px 18px', borderBottom: '1px solid var(--card-border)' }}>
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          Failed to load events
        </p>
      ) : events.length === 0 ? (
        <p style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          No recent transactions
        </p>
      ) : (
        <AnimatePresence initial={false}>
          {events.slice(0, 15).map((e, i) => (
            <EventRow key={e.id} event={e} index={i} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
});
