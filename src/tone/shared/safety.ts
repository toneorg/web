// Gerado de toneorg/server@4c5f788472c2 (packages/shared/src/safety.ts). Não edite aqui.
// RNF11: the agent never pays. This is enforced in code and not left to the
// model: no checkout address is opened or linked, whatever the model asked.

const CHECKOUT_PATH =
  /(\/checkout|\/gz\/checkout|\/pagamento|\/payment|\/pay\b|\/buy\b|\/comprar\b|\/finalizar|\/purchase|\/order-confirm|\/gp\/buy\/|\/spc\/)/i;

const CHECKOUT_HOST = /(^|\.)(pagamento|checkout|pay|mercadopago)\./i;

export function isCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return CHECKOUT_PATH.test(parsed.pathname) || CHECKOUT_HOST.test(`${parsed.hostname}.`);
  } catch {
    return false;
  }
}

/** Whether a URL may be opened by the agent: the store's own pages and nothing that pays. */
export function isAllowedNavigation(url: string, allowedHosts: readonly string[]): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (isCheckoutUrl(url)) return false;
  return allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
}

/**
 * Where store product photos are served from, besides the stores' own hosts. The research by the
 * server lists Google Shopping's own thumbnails (encrypted-tbnN.gstatic.com), the same ones it
 * downloads to compare photos; Google serves them, not the page text.
 */
export const IMAGE_HOSTS = [
  "media-amazon.com",
  "ssl-images-amazon.com",
  "images-amazon.com",
  "mlstatic.com",
  // Magalu's photo CDN and Shein's, from the stores read through Oxylabs.
  "mlcdn.com.br",
  "ltwebstatic.com",
  // Store CDNs of the stores read from their own search (VTEX stores, KaBuM).
  "vtexassets.com",
  "vteximg.com.br",
  "images.kabum.com.br",
  // Photos of the Shopify Global Catalog (19/11/2026), the stores' own uploads.
  "cdn.shopify.com",
  // Photo CDNs of the stores read through Tilion (20/11/2026).
  "img.lojasrenner.com.br",
  "static.zara.net",
  "static.dafiti.com.br",
  "imgcentauro-a.akamaihd.net",
  "product-data.raiadrogasil.io",
  "encrypted-tbn0.gstatic.com",
  "encrypted-tbn1.gstatic.com",
  "encrypted-tbn2.gstatic.com",
  "encrypted-tbn3.gstatic.com",
] as const;

/**
 * Whether a component may load this image: HTTPS from a store or its photo CDN.
 * Anything else could be a tracking pixel planted in the page text.
 */
export function isAllowedImage(url: string | null | undefined, storeHosts: readonly string[]): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  // Plain HTTP only for the local copy of the store in the end-to-end test.
  const local = parsed.protocol === "http:" && parsed.hostname === "localhost" && storeHosts.includes("localhost");
  if (parsed.protocol !== "https:" && !local) return false;
  return [...IMAGE_HOSTS, ...storeHosts].some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
  );
}

/** The store of an offer known only from the index, whose link is Google Shopping's product page. */
export const GOOGLE_SHOPPING = "google.com";

/**
 * A Google Shopping product page: the stores selling one product, from the index.
 * Only `/search` with a product or shopping marker, never `/url` (which forwards
 * anywhere) or another Google page.
 */
export function isGoogleShoppingUrl(url: string | null | undefined): boolean {
  if (!url || !URL.canParse(url)) return false;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) return false;
  if (!["google.com", "www.google.com", "google.com.br", "www.google.com.br"].includes(parsed.hostname)) return false;
  if (parsed.pathname !== "/search") return false;
  const params = parsed.searchParams;
  return (
    params.has("prds") || params.get("ibp") === "oshop" || params.get("tbm") === "shop" || params.get("udm") === "28"
  );
}
