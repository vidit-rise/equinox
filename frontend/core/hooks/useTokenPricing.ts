'use client';
import useSWR from 'swr';
import { fetchPrice } from '@/core/lib/stellarClientReads';

export const useTokenPricing = () => {
  const { data, isLoading } = useSWR('sst-price', fetchPrice, { refreshInterval: 5000 });

  return {
    price: data?.price || '0.00',
    change24h: data?.change24h || '0.00',
    isLoading,
  };
};
