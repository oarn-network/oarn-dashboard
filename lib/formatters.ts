import { formatUnits, parseUnits } from 'viem';

/**
 * Format ETH value with appropriate decimal places
 */
export function formatEth(value: bigint | string | number, decimals: number = 4): string {
  const wei = typeof value === 'bigint' ? value : BigInt(value);
  const formatted = formatUnits(wei, 18);
  const num = parseFloat(formatted);

  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format token amount (COMP/GOV)
 */
export function formatTokens(value: bigint | string | number, decimals: number = 2): string {
  const wei = typeof value === 'bigint' ? value : BigInt(value);
  const formatted = formatUnits(wei, 18);
  const num = parseFloat(formatted);

  if (num === 0) return '0';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Parse ETH string to wei
 */
export function parseEth(value: string): bigint {
  return parseUnits(value, 18);
}

/**
 * Format address to shortened form (0x1234...abcd)
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format hash (bytes32) to shortened form
 */
export function formatHash(hash: string, chars: number = 8): string {
  if (!hash) return '';
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number | Date): string {
  const now = Date.now();
  const time = typeof timestamp === 'number' ? timestamp * 1000 : timestamp.getTime();
  const diff = now - time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format deadline timestamp to human readable
 */
export function formatDeadline(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / 3600);
  const days = Math.floor(hours / 24);

  if (hours < 1) return `${Math.floor(diff / 60)}m remaining`;
  if (hours < 24) return `${hours}h remaining`;
  if (days < 7) return `${days}d remaining`;

  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDate(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
  return date.toISOString().split('T')[0];
}

/**
 * Format date to full datetime string
 */
export function formatDateTime(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K';
  }
  return value.toString();
}

/**
 * Get IPFS URL from CID
 */
export function getIPFSUrl(cid: string, gateway: string = 'https://ipfs.io/ipfs/'): string {
  if (!cid) return '';
  // Remove ipfs:// prefix if present
  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  return `${gateway}${cleanCid}`;
}

/**
 * Get Arbiscan URL for address/tx
 */
export function getArbiscanUrl(value: string, type: 'address' | 'tx' = 'address'): string {
  const baseUrl = 'https://sepolia.arbiscan.io';
  return `${baseUrl}/${type}/${value}`;
}
