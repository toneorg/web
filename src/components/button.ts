// One button look for links, submits and share actions. Plain function, no
// JSX, so server and client components can both use it.

type Variant = "solid" | "outline";
type Size = "sm" | "md" | "lg";

const base = "press inline-flex items-center justify-center rounded-full font-semibold";

const variants: Record<Variant, string> = {
  solid:
    "bg-ink text-paper hover:bg-ink-hover disabled:cursor-progress disabled:bg-ink-disabled",
  outline:
    "bg-white shadow-[inset_0_0_0_1px_var(--color-rule)] hover:shadow-[inset_0_0_0_1px_var(--color-edge-hover)]",
};

const sizes: Record<Size, string> = {
  sm: "min-h-13 px-6",
  md: "min-h-13 px-7 text-[1.05rem]",
  lg: "min-h-14 px-8 text-[1.05rem]",
};

export function buttonClass({
  variant = "solid",
  size = "md",
}: { variant?: Variant; size?: Size } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}
