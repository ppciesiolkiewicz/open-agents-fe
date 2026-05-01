import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function PlayIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 3.5v9a.5.5 0 0 0 .76.43l7.5-4.5a.5.5 0 0 0 0-.86l-7.5-4.5A.5.5 0 0 0 5 3.5z" />
    </svg>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="4" width="8" height="8" rx="1" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h9A1.5 1.5 0 0 1 14 5.5V6H3a1 1 0 0 0 0 2h11v4.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-7Z" />
      <circle cx="11" cy="10" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="5.25" r="2.25" />
      <path d="M3.25 13a4.75 4.75 0 0 1 9.5 0" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="5" y="5" width="8" height="8" rx="1.5" />
      <path d="M3 11V4.5A1.5 1.5 0 0 1 4.5 3H11" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.25v3.5" />
      <circle cx="8" cy="5.25" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UnichainIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="7" fill="#FF007A" />
      <path
        d="M5 4.75v3.75a3 3 0 0 0 6 0V4.75"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.06a1.7 1.7 0 0 0 1.04-1.55V2.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.06a1.7 1.7 0 0 0 1.55 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1.04Z" />
    </svg>
  );
}
