// One button shape for links and submits. Plain function, no JSX, so server
// and client components can both use it.

/** `wine` is the primary action on light and coral grounds; `coral` is the primary on wine. */
type Variant = "wine" | "coral" | "quiet";
type Size = "md" | "lg";

const base =
  "press inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-progress";

// Each variant names its own focus ring. The page default (the text color)
// would vanish here: a wine button's text is white, and it sits on white.
const variants: Record<Variant, string> = {
  wine: "bg-wine text-white hover:bg-wine-800 focus-visible:outline-wine disabled:bg-wine-800",
  coral:
    "bg-coral text-wine hover:bg-coral-300 focus-visible:outline-coral-200 disabled:bg-coral-300",
  quiet: "bg-coral-100 text-wine hover:bg-coral-200 focus-visible:outline-wine",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 text-[0.9375rem]",
  lg: "min-h-13 px-7 text-[1.0625rem]",
};

export function buttonClass({
  variant = "wine",
  size = "md",
}: { variant?: Variant; size?: Size } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}
