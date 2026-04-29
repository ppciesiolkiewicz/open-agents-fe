import { Configuration, DefaultApi } from "@/sdk";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function setApiAccessTokenGetter(getter: TokenGetter) {
  getToken = getter;
}

export async function getApiAccessToken(): Promise<string | null> {
  return getToken();
}

export const api = new DefaultApi(
  new Configuration({
    basePath: API_BASE_URL,
    middleware: [
      {
        pre: async ({ url, init }) => {
          const token = await getToken();
          if (!token) return { url, init };
          const headers = new Headers(init.headers);
          headers.set("Authorization", `Bearer ${token}`);
          return { url, init: { ...init, headers } };
        },
      },
    ],
  }),
);
