/**
 * Format USD amount
 */
export function formatUSD(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format APY percentage
 */
export function formatAPY(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

/**
 * Format token amount
 */
export function formatTokenAmount(
  amount: string | number,
  decimals: number = 6
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(Math.min(decimals, 6));
}

/**
 * Format address (0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Format protocol name
 */
export function formatProtocolName(protocol: string): string {
  const names: Record<string, string> = {
    Aave: "Aave V3",
    Compound: "Compound V3",
    Yearn: "Yearn Finance",
    Curve: "Curve Finance",
    Beefy: "Beefy Finance",
  };
  return names[protocol] || protocol;
}

/**
 * Format chain name
 */
export function formatChainName(chainId: number): string {
  const names: Record<number, string> = {
    1: "Ethereum",
    137: "Polygon",
    42161: "Arbitrum",
    10: "Optimism",
    8453: "Base",
  };
  return names[chainId] || `Chain ${chainId}`;
}

/**
 * Format days to human readable
 */
export function formatDays(days: number): string {
  if (days === Infinity) return "Never";
  if (days < 1) return "< 1 day";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format risk score to label
 */
export function formatRiskLabel(riskScore: number): string {
  if (riskScore <= 3) return "Low Risk";
  if (riskScore <= 6) return "Medium Risk";
  return "High Risk";
}

/**
 * Format risk color
 */
export function getRiskColor(riskScore: number): string {
  if (riskScore <= 3) return "text-green-500";
  if (riskScore <= 6) return "text-yellow-500";
  return "text-red-500";
}
