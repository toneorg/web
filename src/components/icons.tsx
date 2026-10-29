// Icons inherit their color from the text around them. The stroke is 1.5px,
// the optical match for regular-weight text; `bold` is 2px, for an icon that
// sits alone inside a filled control.

type IconProps = { className?: string; bold?: boolean };

function stroke(bold?: boolean) {
  return {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: bold ? 2 : 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
}

export function CheckIcon({ className, bold }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} {...stroke(bold)}>
      <path d="M3 8.5l3.25 3.25L13 4.75" />
    </svg>
  );
}

export function ChevronIcon({ className, bold }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} {...stroke(bold)}>
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

/** A speech bubble: something she asked for. */
export function ChatIcon({ className, bold }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} {...stroke(bold)}>
      <path d="M2.75 7.5c0-2.62 2.35-4.75 5.25-4.75s5.25 2.13 5.25 4.75S10.9 12.25 8 12.25c-.6 0-1.17-.09-1.7-.25l-2.8 1.25.6-2.3a4.5 4.5 0 0 1-1.35-3.45Z" />
    </svg>
  );
}
