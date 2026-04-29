const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

if (!APP_ID && process.env.NODE_ENV !== "test") {
  console.warn(
    "[privy] NEXT_PUBLIC_PRIVY_APP_ID is missing — sign-in will fail.",
  );
}

export const PRIVY_APP_ID = APP_ID ?? "";

export const PRIVY_CONFIG = {
  embeddedWallets: { createOnLogin: "off" as const },
  appearance: { theme: "light" as const },
};
