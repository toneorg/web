// Hand-drawn line icons for the public pages, in the color of the text around
// them (components/icon.md): 24 grid, 1.5 stroke beside regular text.

type IconProps = { className?: string };

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ArrowIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckMark({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line} strokeWidth={2}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CrossMark({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line} strokeWidth={2}>
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
}

/** A parcel coming back: the purchase that did not fit. */
export function ReturnIcon({ className = "size-6" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z" />
      <path d="M4 8.5 12 13l8-4.5M12 13v7" />
      <path d="M9.5 6.2l8 4.5" />
    </svg>
  );
}

/** Too many tabs open. */
export function TabsIcon({ className = "size-6" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <rect x="3" y="7" width="15" height="12" rx="2.5" />
      <path d="M6 7V5.5A1.5 1.5 0 0 1 7.5 4H19a2 2 0 0 1 2 2v9.5a1.5 1.5 0 0 1-1.5 1.5H18" />
      <path d="M3 11h15" />
    </svg>
  );
}

/** Money changing hands behind the recommendation. */
export function CoinIcon({ className = "size-6" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <circle cx="12" cy="12" r="8" />
      <path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.4-2.5-1.2M12 6.5V8M12 16v1.5" />
    </svg>
  );
}

export function SparkIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </svg>
  );
}

export function BookmarkIcon({ className = "size-5" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function BellIcon({ className = "size-5" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function WindowIcon({ className = "size-5" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9h18M15 9v10.5" />
    </svg>
  );
}

export function ShieldIcon({ className = "size-5" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function ChartIcon({ className = "size-5" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <path d="M4 20h16M7 16v-4M12 16V7M17 16v-6" />
    </svg>
  );
}

export function PlugIcon({ className = "size-5" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...line}>
      <path d="M9 3v4M15 3v4M7 7h10v3a5 5 0 0 1-10 0zM12 15v6" />
    </svg>
  );
}

export function HeadphonesIcon({ className = "size-6" }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className} {...line} strokeWidth={1.25}>
      <path d="M9 30v-5a15 15 0 0 1 30 0v5" />
      <rect x="6" y="28" width="8" height="12" rx="3" />
      <rect x="34" y="28" width="8" height="12" rx="3" />
    </svg>
  );
}
