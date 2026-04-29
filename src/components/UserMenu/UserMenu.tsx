"use client";

import { useLogout, usePrivy } from "@privy-io/react-auth";
import { Dropdown, DropdownItem } from "@/ui/Dropdown";
import { Button } from "@/ui/Button";

function shortDid(did: string): string {
  if (did.length <= 16) return did;
  return `${did.slice(0, 12)}…${did.slice(-4)}`;
}

function identityLabel(user: ReturnType<typeof usePrivy>["user"]): string {
  if (!user) return "Account";
  const email = user.email?.address;
  if (email) return email;
  const name = user.google?.name ?? user.twitter?.name ?? user.discord?.username;
  if (name) return name;
  return shortDid(user.id);
}

export function UserMenu() {
  const { user, ready, authenticated } = usePrivy();
  const { logout } = useLogout();

  if (!ready || !authenticated) return null;

  const label = identityLabel(user);

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="sm" aria-label="Account menu">
          <span className="max-w-40 truncate">{label}</span>
        </Button>
      }
    >
      <DropdownItem onSelect={() => void logout()}>Sign out</DropdownItem>
    </Dropdown>
  );
}
