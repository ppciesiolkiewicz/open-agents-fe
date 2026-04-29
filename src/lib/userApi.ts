import { API_BASE_URL, getApiAccessToken } from "@/lib/api";

export interface MeUser {
  id: string;
  privyDid: string;
  email: string | null;
  createdAt: number;
}

export interface WalletBalanceItem {
  raw: string;
  formatted: string;
}

export interface OgBalance extends WalletBalanceItem {
  priceUsd: number;
  valueUsd: number;
}

export interface WalletBalances {
  usdcOnUnichain: WalletBalanceItem;
  ogOnZerog: OgBalance;
}

export interface MeWallet {
  id: string;
  walletAddress: string;
  isPrimary: boolean;
  createdAt: number;
  balances: WalletBalances | null;
}

export interface MeResponse {
  user: MeUser;
  wallets: MeWallet[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getApiAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchUserMe(): Promise<MeResponse> {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MeResponse;
}

export async function postUserWallet(): Promise<MeWallet> {
  const res = await fetch(`${API_BASE_URL}/users/me/wallets`, {
    method: "POST",
    headers: {
      ...(await authHeaders()),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MeWallet;
}
