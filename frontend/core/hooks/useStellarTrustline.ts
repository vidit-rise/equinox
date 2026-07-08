'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { signTransaction } from '@stellar/freighter-api';
import { fetchBalances } from '@/core/lib/stellarClientReads';
import { HORIZON_URL, NETWORK_PASSPHRASE, SST_ISSUER } from '@/core/lib/networkConfig';

export const useStellarTrustline = (publicKey: string) => {
  const { data, mutate, isLoading } = useSWR(
    publicKey ? ['balances', publicKey] : null,
    ([, pk]: [string, string]) => fetchBalances(pk),
    { refreshInterval: 5000 }
  );

  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const addTrustline = async () => {
    if (!publicKey) return;
    setIsAdding(true);
    setAddError(null);

    try {
      const { Horizon, TransactionBuilder, Operation, Asset, BASE_FEE } = await import('@stellar/stellar-sdk');
      const server = new Horizon.Server(HORIZON_URL);
      const account = await server.loadAccount(publicKey);

      const sstAsset = new Asset('SST', SST_ISSUER);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.changeTrust({
            asset: sstAsset,
            limit: '1000000', // 1M SST limit
          })
        )
        .setTimeout(180)
        .build();

      const signedResult = await signTransaction(tx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      const signedXDR: string =
        typeof signedResult === 'string'
          ? signedResult
          : (signedResult as { signedTxXdr?: string })?.signedTxXdr ?? '';

      if (!signedXDR) throw new Error('Freighter did not return a signed transaction');

      const signedTx = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
      const response = await server.submitTransaction(signedTx);

      await mutate();
      return (response as unknown as { hash: string }).hash;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAddError(msg);
      console.error('[useStellarTrustline] addTrustline failed:', msg);
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  return {
    hasTrustline: data?.hasTrustline || false,
    sstBalance: data?.sstBalance || '0',
    sstLimit: data?.sstLimit || '0',
    isLoading,
    isAdding,
    addError,
    addTrustline,
  };
};
