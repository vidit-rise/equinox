'use client';
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Droplets, Zap, RefreshCw } from 'lucide-react';
import { useTokenPricing } from '@/core/hooks/useTokenPricing';
import { usePoolMetrics } from '@/core/hooks/usePoolMetrics';
import { stagger } from '@/core/lib/motionPresets';
import { SkeletonCard } from '@/core/components/VisualSkeleton';
import useSWR from 'swr';

interface StatItem {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
}

const StatMetric = memo(function StatMetric({ item, index }: { item: StatItem; index: number }) {
  const { icon: Icon, label, value, sub, color } = item;
  return (
    <motion.div
      {...stagger(index)}
      className="glass-card"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `${color}12`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: 'var(--foreground)' }}>{value}</p>
        {sub && (
          <p style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: sub.startsWith('+') ? 'var(--success)' : 'var(--muted)' }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
});

export const LiquidityMetricsBar = memo(function LiquidityMetricsBar() {
  const { price, change24h, isLoading: priceLoading } = useTokenPricing();
  const { tvl, volume24h, apy, isLoading: poolLoading } = usePoolMetrics();
  const { isValidating: priceValidating } = useSWR('/api/price');
  const { isValidating: poolValidating }  = useSWR('/api/pool');
  const isValidating = priceValidating || poolValidating;
  const isLoading    = priceLoading || poolLoading;

  const stats: StatItem[] = [
    {
      label: 'SST Price',
      value: `$${parseFloat(price).toFixed(6)}`,
      sub: `${parseFloat(change24h) >= 0 ? '+' : ''}${change24h}% 24h`,
      icon: TrendingUp,
      color: '#4f46e5',
    },
    {
      label: 'Total Value Locked',
      value: `$${parseFloat(tvl).toLocaleString()}`,
      sub: `APY ${apy}%`,
      icon: Droplets,
      color: '#2563eb',
    },
    {
      label: '24h Volume',
      value: `$${parseFloat(volume24h).toLocaleString()}`,
      sub: '',
      icon: Zap,
      color: '#059669',
    },
  ];

  return (
    <section style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <span style={{
          fontSize: 12, color: 'var(--muted)', fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Live Stats
        </span>
        <RefreshCw
          size={11}
          style={{
            color: isValidating ? 'var(--accent)' : 'var(--muted)',
            animation: isValidating ? 'spin 0.9s linear infinite' : 'none',
            transition: 'color 0.2s',
          }}
        />
      </div>

      <div className="grid-layout" style={{ padding: 0 }}>
        {isLoading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} rows={2} />)
          : stats.map((s, i) => <StatMetric key={s.label} item={s} index={i} />)
        }
      </div>
    </section>
  );
});
