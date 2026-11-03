// Facts about the site that more than one file needs. No directive, so both
// server and client modules can import it.

/** Public origin without a trailing slash. Unset in local dev. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || undefined;

/** Address for deletion requests and replies. Unset hides the links that would use it. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined;

/** Where the app lives once the person is signed in. */
export const APP_PATH = "/conversas";
