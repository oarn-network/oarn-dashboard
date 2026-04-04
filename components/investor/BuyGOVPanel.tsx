'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Card, Button } from '@/components/ui';
import { useGOVSaleInfo, useWalletSaleInfo, useBuyGOV } from '@/hooks/useBuyGOV';

export function BuyGOVPanel() {
  const { address } = useAccount();
  const { data: sale, isLoading: loadingSale } = useGOVSaleInfo();
  const { data: walletInfo } = useWalletSaleInfo();
  const { mutateAsync: buyGOV, isPending, isSuccess, isError, error } = useBuyGOV();

  const [ethAmount, setEthAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ETH' | 'USDC'>('ETH');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Derived: GOV the user will receive for the typed ETH amount
  const govPreview = (() => {
    if (!sale || !ethAmount || isNaN(Number(ethAmount)) || Number(ethAmount) <= 0) return null;
    try {
      const eth = parseEther(ethAmount);
      const gov = (eth * sale.price) / parseEther('1');
      return Number(formatEther(gov));
    } catch {
      return null;
    }
  })();

  const exceedsCap =
    govPreview !== null &&
    walletInfo !== null &&
    walletInfo !== undefined &&
    govPreview > Number(formatEther(walletInfo.remainingCap));

  const insufficientPool =
    govPreview !== null &&
    sale !== null &&
    sale !== undefined &&
    govPreview > Number(formatEther(sale.remainingGOV));

  const canBuy =
    !!address &&
    !!sale &&
    !sale.paused &&
    !!ethAmount &&
    Number(ethAmount) > 0 &&
    !exceedsCap &&
    !insufficientPool &&
    !isPending;

  async function handleBuy() {
    if (!canBuy) return;
    try {
      const result = await buyGOV(ethAmount);
      setTxHash(result.hash);
      setEthAmount('');
    } catch {
      // error shown below via isError
    }
  }

  // ── Not yet deployed ──────────────────────────────────────────────────────

  if (!loadingSale && !sale) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-text mb-2">Buy GOV</h3>
        <p className="text-sm text-text-muted">
          GOV genesis sale coming soon. Contract not yet deployed.
        </p>
      </Card>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loadingSale) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-text mb-4">Buy GOV</h3>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-background-light rounded w-2/3" />
          <div className="h-4 bg-background-light rounded w-1/2" />
          <div className="h-10 bg-background-light rounded" />
        </div>
      </Card>
    );
  }

  const soldPercent = sale!.soldPercent;
  const remainingPercent = 100 - soldPercent;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text">Buy GOV</h3>
        {sale!.paused && (
          <span className="text-xs font-medium text-error bg-error/10 px-2 py-0.5 rounded-full">
            Paused
          </span>
        )}
        {!sale!.paused && (
          <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
            Live
          </span>
        )}
      </div>

      {/* Price info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-background-light rounded-lg">
          <p className="text-xs text-text-muted mb-0.5">Price</p>
          <p className="text-sm font-semibold text-text">{sale!.ethPerGOV} ETH / GOV</p>
          <p className="text-xs text-text-muted">{sale!.priceFormatted} GOV / ETH</p>
        </div>
        <div className="p-3 bg-background-light rounded-lg">
          <p className="text-xs text-text-muted mb-0.5">Wallet cap</p>
          <p className="text-sm font-semibold text-text">{sale!.walletCapFormatted} GOV</p>
          {walletInfo && (
            <p className="text-xs text-text-muted">{walletInfo.remainingCapFormatted} remaining</p>
          )}
        </div>
      </div>

      {/* Pool allocation bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span>Remaining allocation</span>
          <span>{sale!.remainingGOVFormatted} GOV ({remainingPercent.toFixed(1)}%)</span>
        </div>
        <div className="h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${remainingPercent}%` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1">30M GOV total in genesis sale pool</p>
      </div>

      {/* Payment method selector */}
      <div className="flex rounded-lg overflow-hidden border border-border mb-4">
        <button
          onClick={() => setPaymentMethod('ETH')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            paymentMethod === 'ETH'
              ? 'bg-primary text-white'
              : 'bg-surface text-text-muted hover:text-text'
          }`}
        >
          ETH
        </button>
        <button
          onClick={() => setPaymentMethod('USDC')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            paymentMethod === 'USDC'
              ? 'bg-primary text-white'
              : 'bg-surface text-text-muted hover:text-text'
          }`}
          title="USDC payments coming soon"
        >
          USDC <span className="text-xs opacity-60">(soon)</span>
        </button>
      </div>

      {/* ETH input */}
      {paymentMethod === 'ETH' ? (
        <div className="mb-4">
          <label className="block text-xs text-text-muted mb-1.5">Amount (ETH)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.001"
              placeholder="0.0"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="w-full bg-background-light border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted font-medium">
              ETH
            </span>
          </div>
          {govPreview !== null && (
            <p className="text-xs text-accent mt-1.5">
              ≈ {govPreview.toLocaleString()} GOV
            </p>
          )}
          {exceedsCap && (
            <p className="text-xs text-error mt-1">Exceeds your wallet cap.</p>
          )}
          {insufficientPool && !exceedsCap && (
            <p className="text-xs text-error mt-1">Not enough GOV in pool.</p>
          )}
        </div>
      ) : (
        <div className="mb-4 p-4 bg-background-light rounded-lg text-center">
          <p className="text-sm text-text-muted">USDC payments coming soon.</p>
        </div>
      )}

      {/* Your purchases */}
      {walletInfo && Number(walletInfo.purchased) > 0 && (
        <div className="flex items-center justify-between text-xs text-text-muted mb-4 p-2 bg-background-light rounded-lg">
          <span>You&apos;ve purchased</span>
          <span className="font-medium text-text">{walletInfo.purchasedFormatted} GOV</span>
        </div>
      )}

      {/* Success / error */}
      {isSuccess && txHash && (
        <div className="mb-3 p-2 bg-success/10 rounded-lg">
          <p className="text-xs text-success">
            Purchase confirmed!{' '}
            <a
              href={`https://sepolia.arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              View tx
            </a>
          </p>
        </div>
      )}
      {isError && (
        <div className="mb-3 p-2 bg-error/10 rounded-lg">
          <p className="text-xs text-error">
            {(error as Error)?.message?.split('(')[0] ?? 'Transaction failed.'}
          </p>
        </div>
      )}

      {/* Buy button */}
      {!address ? (
        <p className="text-sm text-text-muted text-center py-1">Connect wallet to buy GOV</p>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          onClick={handleBuy}
          isLoading={isPending}
          disabled={!canBuy || paymentMethod === 'USDC'}
        >
          {isPending ? 'Buying…' : 'Buy GOV'}
        </Button>
      )}
    </Card>
  );
}
