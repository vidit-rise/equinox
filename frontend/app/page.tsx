'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpDown, Droplets, Activity, TrendingUp, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { useFreighterWallet } from '@/core/hooks/useFreighterWallet';
import { LiquidityMetricsBar } from '@/core/components/LiquidityMetricsBar';
import { MobileNavigation } from '@/core/components/MobileNavigation';
import { floatUp, stagger } from '@/core/lib/motionPresets';

const FEATURES = [
  {
    title: 'Swap Tokens',
    desc: 'Instantly swap SST ↔ XLM using the constant-product AMM on Stellar Soroban.',
    href: '/swap',
    cta: 'Start Swapping',
    icon: ArrowUpDown,
    accent: '#4f46e5',
  },
  {
    title: 'Provide Liquidity',
    desc: 'Deposit SST + XLM into the pool and earn proportional yield on every swap.',
    href: '/pool',
    cta: 'Add Liquidity',
    icon: Droplets,
    accent: '#2563eb',
  },
  {
    title: 'Your Dashboard',
    desc: 'Monitor your SST balance, trustline status, and live on-chain transactions.',
    href: '/dashboard',
    cta: 'View Dashboard',
    icon: Activity,
    accent: '#059669',
  },
];

const PROTOCOL_HIGHLIGHTS = [
  { icon: Shield, label: 'Auditable contracts', value: 'Open-source Soroban' },
  { icon: Zap, label: 'Settlement time', value: '~5s on Testnet' },
  { icon: TrendingUp, label: 'Estimated APY', value: '12.5%' },
];

export default function HomePage() {
  const { isConnected, connect, publicKey, network } = useFreighterWallet();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <main style={{ minHeight: '100vh', paddingBottom: 100, background: 'var(--background)' }}>
      {/* ── Hero ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: '80px 24px 64px',
        textAlign: 'center',
        borderBottom: '1px solid var(--card-border)',
      }}>
        {/* Subtle accent gradient — top only */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 640, height: 2,
          background: 'linear-gradient(90deg, transparent, #4f46e5 50%, transparent)',
          pointerEvents: 'none',
        }} />

        {/* Logo mark */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 28px',
            background: 'linear-gradient(135deg, #18181b, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 20, color: '#ffffff',
            boxShadow: '0 8px 32px rgba(79,70,229,0.2)',
          }}
        >
          EQ
        </motion.div>

        <motion.div {...floatUp}>
          {/* Network pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--muted-bg)', border: '1px solid var(--card-border)',
            padding: '4px 14px', borderRadius: 9999, marginBottom: 20,
            fontSize: 12, fontWeight: 600, color: 'var(--muted)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            Live on Stellar {network}
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 7vw, 72px)', fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: 'var(--foreground)',
            marginBottom: 20,
          }}>
            Equinox AMM
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2.2vw, 18px)', color: 'var(--muted)',
            maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.65,
          }}>
            A precision-built constant-product AMM on Stellar Testnet. Swap SST ↔ XLM,
            provide liquidity, and watch live on-chain events — fully via Soroban.
          </p>

          {isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
                borderRadius: 8, padding: '8px 16px', fontFamily: 'monospace',
                fontSize: 13, color: 'var(--success)', fontWeight: 600,
              }}>
                ● {publicKey.slice(0, 6)}…{publicKey.slice(-6)}
              </div>
              <Link href="/dashboard">
                <button
                  id="open-dashboard-btn"
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '12px 28px', fontSize: 16 }}
                >
                  Open Dashboard <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          ) : (
            <motion.button
              id="connect-wallet-hero-btn"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-primary"
              onClick={connect}
              style={{ fontSize: 16, padding: '14px 36px', minHeight: 52 }}
            >
              Connect Freighter Wallet
            </motion.button>
          )}
        </motion.div>
      </section>

      {/* ── Protocol Highlights ── */}
      <div style={{ borderBottom: '1px solid var(--card-border)', background: 'var(--muted-bg)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: 0, justifyContent: 'center' }}>
          {PROTOCOL_HIGHLIGHTS.map(({ icon: Icon, label, value }, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 32px',
              borderRight: i < PROTOCOL_HIGHLIGHTS.length - 1 ? '1px solid var(--card-border)' : 'none',
            }}>
              <Icon size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live Stats ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0' }}>
        <LiquidityMetricsBar />
      </div>

      {/* ── Feature Cards ── */}
      <div className="grid-layout">
        {FEATURES.map(({ title, desc, href, cta, icon: Icon, accent }, i) => (
          <motion.div
            key={href} {...stagger(i)}
            className="glass-card"
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `${accent}10`, border: `1px solid ${accent}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={20} style={{ color: accent }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>{title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
            </div>
            <Link href={href} style={{ display: 'block' }}>
              <button
                id={`feature-${title.toLowerCase().replace(/\s+/g, '-')}-btn`}
                className="btn-primary"
                style={{ width: '100%', minHeight: 44 }}
              >
                {cta} <ArrowRight size={14} />
              </button>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Footer info strip ── */}
      <div style={{
        textAlign: 'center', padding: '48px 24px 24px',
        color: 'var(--muted)', fontSize: 13,
      }}>
        Built on{' '}
        <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--foreground)', fontWeight: 600, textDecoration: 'underline' }}>
          Stellar
        </a>
        {' '}using{' '}
        <a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--foreground)', fontWeight: 600, textDecoration: 'underline' }}>
          Soroban
        </a>
        {' '}smart contracts · Testnet
      </div>

      <MobileNavigation />
    </main>
  );
}
