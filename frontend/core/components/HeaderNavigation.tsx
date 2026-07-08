'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Wallet, Activity,
  ArrowUpDown, Droplets, BarChart3, Copy, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { useFreighterWallet } from '@/core/hooks/useFreighterWallet';
import { floatUp } from '@/core/lib/motionPresets';

const NAV_LINKS = [
  { href: '/',          label: 'Home',      icon: BarChart3 },
  { href: '/swap',      label: 'Swap',      icon: ArrowUpDown },
  { href: '/pool',      label: 'Pool',      icon: Droplets },
  { href: '/dashboard', label: 'Dashboard', icon: Activity },
];

export function HeaderNavigation() {
  const pathname = usePathname();
  const { isConnected, connect, disconnect, publicKey, network, isLoading } = useFreighterWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.header
        {...floatUp}
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(250, 249, 246, 0.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, minWidth: 0 }}>
 
            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--foreground)' }}>
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                suppressHydrationWarning
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--accent), #4b5563)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 13, color: 'var(--accent-foreground)',
                }}
              >
                EQ
              </motion.div>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Equinox AMM</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden-mobile" style={{ gap: 4, marginLeft: 16 }}>
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href} href={href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8, textDecoration: 'none',
                      fontSize: 14, fontWeight: active ? 600 : 500,
                      color: active ? 'var(--foreground)' : 'var(--muted)',
                      background: active ? 'var(--highlight-bg)' : 'transparent',
                      border: active ? '1px solid var(--card-border)' : '1px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={15} style={{ color: active ? 'var(--foreground)' : 'inherit' }} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Wallet Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Network badge */}
            <div style={{
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
              color: 'var(--success)',
            }}>
              {network}
            </div>

            {isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div 
                  className="hidden-mobile"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace',
                    color: 'var(--foreground)',
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                  {publicKey.slice(0, 5)}…{publicKey.slice(-4)}
                  <button
                    onClick={copyKey}
                    title="Copy address"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2, minHeight: 24, display: 'flex', alignItems: 'center' }}
                  >
                    {copied ? <CheckCircle2 size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                  </button>
                </div>
                <button
                  className="hidden-mobile"
                  onClick={disconnect}
                  style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--muted)', padding: '6px 10px', cursor: 'pointer', fontSize: 12, minHeight: 36, fontWeight: 500 }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary"
                onClick={connect}
                disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 14, minHeight: 36 }}
              >
                {isLoading
                  ? <><RefreshCw size={14} style={{ animation: 'spin 0.9s linear infinite' }} /> Connecting…</>
                  : <><Wallet size={16} /> Connect</>
                }
              </motion.button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              style={{
                display: 'none', background: 'none', border: '1px solid var(--card-border)',
                borderRadius: 8, color: 'var(--foreground)', padding: 8, cursor: 'pointer',
                minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center',
              }}
              className="mobile-menu-btn"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, zIndex: 40,
              background: 'rgba(250, 249, 246, 0.98)', backdropFilter: 'blur(16px)',
              borderBottom: '1px solid var(--card-border)', padding: '16px 24px 24px',
            }}
          >
            {NAV_LINKS.map(({ href, label, icon: Icon }, i) => (
              <motion.div key={href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px',
                    borderBottom: '1px solid var(--card-border)', textDecoration: 'none',
                    color: pathname === href ? 'var(--foreground)' : 'var(--muted)',
                    fontWeight: pathname === href ? 600 : 500, fontSize: 16, minHeight: 44,
                  }}
                >
                  <Icon size={18} style={{ color: pathname === href ? 'var(--foreground)' : 'inherit' }} />
                  {label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
