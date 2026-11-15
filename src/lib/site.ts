// Facts about the site that more than one file needs. No directive, so both
// server and client modules can import it.

/**
 * Public origin without a trailing slash. Unset in local dev. On Vercel, without
 * NEXT_PUBLIC_SITE_URL, it is the production domain Vercel reports: link
 * previews need absolute image URLs, and a localhost one shows no image.
 */
const vercelProduction =
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (vercelProduction ? `https://${vercelProduction}` : undefined);

/** Address for deletion requests and replies. Unset hides the links that would use it. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined;

/** Where the app lives once the person is signed in. */
export const APP_PATH = "/conversas";
