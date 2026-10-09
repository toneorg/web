// One button shape for links and submits. Plain function, no JSX, so server
// and client components can both use it.

/** `wine` is the primary action on light and coral grounds; `coral` is the primary on wine. */
type Variant = "wine" | "coral" | "quiet";
type Size = "md" | "lg";

const base =
  "press inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium disabled:cursor-progress";

const variants: Record<Variant, string> = {
  wine: "bg-wine text-white hover:bg-wine-800 disabled:bg-wine-800",
  coral: "bg-coral text-wine hover:bg-coral-300 disabled:bg-coral-300",
  quiet: "bg-coral-100 text-wine hover:bg-coral-200",
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
