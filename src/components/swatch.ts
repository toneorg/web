// How a dot of skin tone is drawn, wherever one appears. No JSX, so server
// and client components can both use it.

/** A pure-black hairline keeps the lightest tones from dissolving into the ground. */
export const SWATCH = "rounded-full outline-1 -outline-offset-1 outline-black/10";

/** The ring around the chosen tone. */
export const SWATCH_PICKED = "shadow-[0_0_0_3px_#fff,0_0_0_5px_var(--color-wine)]";

/** The same ring at the scale of a product page's tiny dots. */
export const SWATCH_PICKED_SMALL = "shadow-[0_0_0_2px_#fff,0_0_0_3.5px_var(--color-wine)]";
