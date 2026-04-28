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
