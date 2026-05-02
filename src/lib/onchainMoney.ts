export function buildOnchainMoneyUrl(walletAddress: string): string {
  return `https://buy.onchain.money/base/usdc?walletAddress=${encodeURIComponent(walletAddress)}`;
}
