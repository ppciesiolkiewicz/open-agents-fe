const TRANSAK_BASE =
  "https://global.transak.com?environment=PRODUCTION&themeColor=1461db" +
  "&productsAvailed=BUY,SELL&defaultFiatAmount=20&fiatCurrency=GBP" +
  "&defaultNetwork=unichain&network=ethereum&paymentMethod=credit_debit_card" +
  "&defaultCryptoCurrency=USDC&cryptoCurrencyCode=ETH&disableWalletAddressForm=true";

export function buildTransakUrl(walletAddress: string): string {
  return `${TRANSAK_BASE}&walletAddress=${encodeURIComponent(walletAddress)}`;
}
