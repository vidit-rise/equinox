'use client';
/**
 * core/lib/stellarClientReads.ts
 *
 * Client-side, read-only chain queries (public RPC + Horizon).
 * Everything here is public data — no secrets.
 */
import {
  rpc,
  Contract,
  Account,
  TransactionBuilder,
  Networks,
  scValToNative,
} from '@stellar/stellar-sdk';

import { SOROBAN_RPC_URL, HORIZON_URL, POOL_CONTRACT, SST_ISSUER } from './networkConfig';

const DUMMY_SOURCE = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const XLM_PRICE_USD = 0.12;
const SST_PRICE_USD = 0.05;

/** Read (sst_reserve, xlm_reserve) in raw stroops via a get_reserves simulation. */
async function getReservesRaw(): Promise<[string, string]> {
  if (!POOL_CONTRACT) return ['0', '0'];
  const server = new rpc.Server(SOROBAN_RPC_URL);
  const contract = new Contract(POOL_CONTRACT);
  const tx = new TransactionBuilder(new Account(DUMMY_SOURCE, '0'), {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call('get_reserves'))
    .setTimeout(0)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
    const native = scValToNative(sim.result.retval);
    if (Array.isArray(native) && native.length >= 2) {
      return [native[0].toString(), native[1].toString()];
    }
  }
  return ['0', '0'];
}

export async function fetchPrice() {
  try {
    const [sst, xlm] = await getReservesRaw();
    const ra = Number(sst);
    const rb = Number(xlm);
    const price = ra > 0 ? rb / ra : 0.05;
    return { price: price.toFixed(6), change24h: '0.00' };
  } catch {
    return { price: '0.050000', change24h: '0.00' };
  }
}

export async function fetchPoolStats() {
  try {
    const [sstReserve, xlmReserve] = await getReservesRaw();
    const xlmNum = Number(xlmReserve) / 1e7;
    const sstNum = Number(sstReserve) / 1e7;
    const tvl = (xlmNum * XLM_PRICE_USD + sstNum * SST_PRICE_USD).toFixed(2);
    return { tvl, xlmReserve, sstReserve, volume24h: '0', apy: '12.5' };
  } catch {
    return { tvl: '0', xlmReserve: '0', sstReserve: '0', volume24h: '0', apy: '12.5' };
  }
}

export async function fetchEvents() {
  try {
    if (!POOL_CONTRACT) return { events: [] };
    const server = new rpc.Server(SOROBAN_RPC_URL);
    const info = await server.getLatestLedger();
    const startLedger = Math.max(1, info.sequence - 8000);
    const res = await server.getEvents({
      startLedger,
      filters: [{ type: 'contract', contractIds: [POOL_CONTRACT] }],
    });

    const events = (res.events || [])
      .map((ev) => {
        const topic = ev.topic.map((t) => scValToNative(t));
        const native = scValToNative(ev.value);
        const topicName = topic[0];
        const firstAmount = Array.isArray(native) ? (Number(native[0]) / 1e7).toString() : '0';
        let type = 'liquidity';
        if (topicName === 'swap') type = 'swap';
        else if (topicName === 'LiquidityAdded' || topicName === 'LiquidityRemoved') type = 'liquidity';
        return {
          id: ev.id,
          type,
          from: topic[1] || 'Unknown',
          amount: firstAmount,
          txHash: (ev as any).txHash || (ev as any).transactionHash || '',
          ledger: ev.ledger,
          timestamp: ev.ledgerClosedAt || new Date().toISOString(),
        };
      })
      .reverse();

    return { events };
  } catch {
    return { events: [] };
  }
}

export async function fetchBalances(publicKey: string) {
  const empty = { sstBalance: '0', xlmBalance: '0', hasTrustline: false, sstLimit: '0' };
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!res.ok) return empty;
    const account = await res.json();
    const balances: any[] = account.balances || [];
    const xlmEntry = balances.find((b) => b.asset_type === 'native');
    const sstEntry = balances.find((b) => b.asset_code === 'SST' && b.asset_issuer === SST_ISSUER);
    return {
      sstBalance: sstEntry?.balance ?? '0',
      xlmBalance: xlmEntry?.balance ?? '0',
      hasTrustline: !!sstEntry,
      sstLimit: sstEntry?.limit ?? '0',
    };
  } catch {
    return empty;
  }
}
