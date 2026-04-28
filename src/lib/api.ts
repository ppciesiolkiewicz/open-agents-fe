import { Configuration, DefaultApi } from "@/sdk";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export const api = new DefaultApi(
  new Configuration({ basePath: API_BASE_URL }),
);
