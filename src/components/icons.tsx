// One stroke weight for the whole page: 1.5px, the optical match for
// regular-weight text. Icons inherit their color from the text around them.

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CheckIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} {...stroke}>
      <path d="M3 8.5l3.25 3.25L13 4.75" />
    </svg>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} {...stroke}>
      <path d="M6.75 9.25a3 3 0 0 0 4.24 0l2.13-2.13a3 3 0 0 0-4.24-4.24l-.76.75" />
      <path d="M9.25 6.75a3 3 0 0 0-4.24 0L2.88 8.88a3 3 0 0 0 4.24 4.24l.76-.75" />
    </svg>
  );
}
