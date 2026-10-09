// Facts about the site that more than one file needs. No directive, so both
// server and client modules can import it.

/** Public origin without a trailing slash. Unset in local dev. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || undefined;

/** Address for deletion requests. Unset hides the links that would use it. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined;

/** Section ids, shared by the sections, the nav and every link that jumps to one. */
export const ANCHOR = {
  top: "topo",
  why: "porque",
  what: "oque",
  how: "como",
  list: "lista",
} as const;

/**
 * Query parameter that opens the list on the brand form. /marcas redirects
 * with it; next.config.ts spells the same pair out, because it cannot import
 * from src.
 */
export const BRAND_PARAM = { key: "para", value: "marca" } as const;
