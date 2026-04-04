'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublicClient, useWriteContract, useAccount } from 'wagmi';
import { parseAbi, parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES, REFRESH_INTERVALS } from '@/lib/constants';

// ── ABI ───────────────────────────────────────────────────────────────────────

const GOV_SALE_ABI = parseAbi([
  'function price() view returns (uint256)',
  'function walletCap() view returns (uint256)',
  'function paused() view returns (bool)',
  'function remainingGOV() view returns (uint256)',
  'function remainingCap(address buyer) view returns (uint256)',
  'function quoteGOV(uint256 ethAmount) view returns (uint256)',
  'function purchased(address buyer) view returns (uint256)',
  'function buyGOV() payable',
]);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GOVSaleInfo {
  price: bigint;           // GOV per 1 ETH (18-dec units)
  priceFormatted: string;  // e.g. "10000"
  ethPerGOV: string;       // e.g. "0.0001"
  walletCap: bigint;
  walletCapFormatted: string;
  remainingGOV: bigint;
  remainingGOVFormatted: string;
  totalGOV: bigint;        // 30M — fixed at genesis
  soldPercent: number;
  paused: boolean;
}

export interface WalletSaleInfo {
  purchased: bigint;
  purchasedFormatted: string;
  remainingCap: bigint;
  remainingCapFormatted: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SALE_ADDRESS = (CONTRACT_ADDRESSES as Record<string, string>).GOV_SALE as `0x${string}` | undefined;
const TOTAL_SALE_GOV = parseEther('30000000'); // 30M GOV = 30% of supply

function saleEnabled(): boolean {
  return !!SALE_ADDRESS && SALE_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Reads global GOVSale state: price, remaining allocation, paused flag.
 */
export function useGOVSaleInfo() {
  const publicClient = usePublicClient();

  return useQuery<GOVSaleInfo | null>({
    queryKey: ['govSale', 'info'],
    queryFn: async () => {
      if (!publicClient || !saleEnabled()) return null;
      const addr = SALE_ADDRESS!;

      const [price, walletCap, remainingGOV, paused] = await Promise.all([
        publicClient.readContract({ address: addr, abi: GOV_SALE_ABI, functionName: 'price' }) as Promise<bigint>,
        publicClient.readContract({ address: addr, abi: GOV_SALE_ABI, functionName: 'walletCap' }) as Promise<bigint>,
        publicClient.readContract({ address: addr, abi: GOV_SALE_ABI, functionName: 'remainingGOV' }) as Promise<bigint>,
        publicClient.readContract({ address: addr, abi: GOV_SALE_ABI, functionName: 'paused' }) as Promise<boolean>,
      ]);

      const priceNum = Number(formatEther(price));
      const ethPerGOV = priceNum > 0 ? (1 / priceNum).toFixed(6) : '0';
      const sold = TOTAL_SALE_GOV > remainingGOV ? TOTAL_SALE_GOV - remainingGOV : BigInt(0);
      const soldPercent = TOTAL_SALE_GOV > BigInt(0)
        ? Math.min(100, Number((sold * BigInt(10000)) / TOTAL_SALE_GOV) / 100)
        : 0;

      return {
        price,
        priceFormatted: priceNum.toLocaleString(),
        ethPerGOV,
        walletCap,
        walletCapFormatted: Number(formatEther(walletCap)).toLocaleString(),
        remainingGOV,
        remainingGOVFormatted: Number(formatEther(remainingGOV)).toLocaleString(),
        totalGOV: TOTAL_SALE_GOV,
        soldPercent,
        paused,
      };
    },
    enabled: !!publicClient && saleEnabled(),
    refetchInterval: REFRESH_INTERVALS.BALANCE,
  });
}

/**
 * Reads per-wallet sale data: how much GOV the connected wallet has bought
 * and how much remains under their cap.
 */
export function useWalletSaleInfo() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery<WalletSaleInfo | null>({
    queryKey: ['govSale', 'wallet', address],
    queryFn: async () => {
      if (!publicClient || !address || !saleEnabled()) return null;
      const addr = SALE_ADDRESS!;

      const [purchased, remainingCap] = await Promise.all([
        publicClient.readContract({ address: addr, abi: GOV_SALE_ABI, functionName: 'purchased', args: [address] }) as Promise<bigint>,
        publicClient.readContract({ address: addr, abi: GOV_SALE_ABI, functionName: 'remainingCap', args: [address] }) as Promise<bigint>,
      ]);

      return {
        purchased,
        purchasedFormatted: Number(formatEther(purchased)).toLocaleString(),
        remainingCap,
        remainingCapFormatted: Number(formatEther(remainingCap)).toLocaleString(),
      };
    },
    enabled: !!publicClient && !!address && saleEnabled(),
    refetchInterval: REFRESH_INTERVALS.BALANCE,
  });
}

/**
 * Mutation: buy GOV tokens by sending ETH.
 * Accepts ethAmount as a decimal string (e.g. "0.1").
 */
export function useBuyGOV() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ethAmountStr: string) => {
      if (!address) throw new Error('Wallet not connected');
      if (!saleEnabled()) throw new Error('GOVSale contract not configured');

      const value = parseEther(ethAmountStr);
      if (value <= BigInt(0)) throw new Error('Amount must be greater than 0');

      const hash = await writeContractAsync({
        address: SALE_ADDRESS!,
        abi: GOV_SALE_ABI,
        functionName: 'buyGOV',
        value,
      });

      return { hash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['govSale'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}
