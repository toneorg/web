// Gerado de toneorg/extension@cab9f784af9d (packages/genui-react/src/Icon.tsx). Não edite aqui.
// Hand-drawn line icons (components/icon.md): 24 grid, round caps, currentColor.
const PATHS = {
  send: "M12 19V5M5 12l7-7 7 7",
  stop: "M7 7h10v10H7z",
  play: "M8 5.5v13l10.5-6.5z",
  close: "M6 6l12 12M18 6L6 18",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  check: "M5 12.5l4.5 4.5L19 7",
  plus: "M12 5v14M5 12h14",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 5v6h-6",
  external: "M14 5h5v5M19 5l-8 8M18 14v5H5V6h5",
  back: "M15 5l-7 7 7 7",
  minus: "M6 12h12",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  bookmark: "M7 4h10v16l-5-4-5 4z",
  forward: "M9 5l7 7-7 7",
  history: "M12 7v5l3 2M3.5 12a8.5 8.5 0 102.5-6M3 4v4h4",
  thumbDown: "M10 15v4a2 2 0 002 2l4-8V4H7.5a2 2 0 00-2 1.6l-1.4 7A2 2 0 006 15h4zM16 4h3v9h-3",
  memory:
    "M12 3a6 6 0 016 6c0 2.4-1.4 3.8-2.5 5-.7.8-1.5 1.6-1.5 3H10c0-1.4-.8-2.2-1.5-3C7.4 12.8 6 11.4 6 9a6 6 0 016-6zM10 20h4",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon(props: { name: IconName; size?: number; stroke?: number }) {
  const size = props.size ?? 20;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.stroke ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[props.name]} />
    </svg>
  );
}
