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

export function GearIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
      <path d="M7.05 1.5a.5.5 0 0 0-.495.43l-.16 1.117a5.51 5.51 0 0 0-1.05.61l-1.05-.42a.5.5 0 0 0-.61.214L2.652 4.74a.5.5 0 0 0 .115.638l.892.71a5.55 5.55 0 0 0 0 1.224l-.892.71a.5.5 0 0 0-.115.638l1.033 1.79a.5.5 0 0 0 .61.213l1.05-.42c.32.245.673.45 1.05.61l.16 1.117a.5.5 0 0 0 .495.43h2.066a.5.5 0 0 0 .495-.43l.16-1.117c.377-.16.73-.365 1.05-.61l1.05.42a.5.5 0 0 0 .61-.214l1.033-1.79a.5.5 0 0 0-.115-.637l-.892-.71a5.55 5.55 0 0 0 0-1.224l.892-.71a.5.5 0 0 0 .115-.638L13.31 3.45a.5.5 0 0 0-.61-.213l-1.05.42a5.51 5.51 0 0 0-1.05-.61l-.16-1.117a.5.5 0 0 0-.495-.43H7.05z" />
    </svg>
  );
}
