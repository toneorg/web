// Gerado de toneorg/extension@bc3273ad0a23 (packages/shared/src/safety.ts). Não edite aqui.
// RNF11: the agent never pays. This is enforced in code, on both sides, and not
// left to the model: the extension refuses to click anything that looks like a
// payment step or to load a checkout page, whatever the model asked.

const CHECKOUT_PATH =
  /(\/checkout|\/gz\/checkout|\/pagamento|\/payment|\/pay\b|\/buy\b|\/comprar\b|\/finalizar|\/purchase|\/order-confirm|\/gp\/buy\/|\/spc\/)/i;

const CHECKOUT_HOST = /(^|\.)(pagamento|checkout|pay|mercadopago)\./i;

/** Labels of controls that start a payment, in Portuguese and English. */
const PAYMENT_LABEL =
  /\b(comprar agora|finalizar( a)? compra|fechar pedido|ir para o pagamento|pagar|continuar para o pagamento|confirmar (a )?compra|comprar com 1-clique|buy now|checkout|place (your )?order|proceed to (checkout|payment))\b/i;

/**
 * Ids and names of payment controls that have no visible text, like Amazon's
 * `<input name="submit.buy-now">` and `<input name="proceedToRetailCheckout">`.
 */
const PAYMENT_NAME = /(buy[-_.]?now|proceed[-_]?to[-_]?(retail[-_]?)?checkout|one[-_]?click|1[-_]?click|checkout)/i;

export function isCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return CHECKOUT_PATH.test(parsed.pathname) || CHECKOUT_HOST.test(`${parsed.hostname}.`);
  } catch {
    return false;
  }
}

/** Whether a control (its visible text, its link, the form it submits) leads to payment. */
export function isPaymentControl(control: {
  text?: string | null;
  href?: string | null;
  formAction?: string | null;
  /** The control's id, name and value, for inputs that carry no text. */
  name?: string | null;
}) {
  if (control.text && PAYMENT_LABEL.test(control.text.replace(/\s+/g, " ").trim())) return true;
  if (control.name && (PAYMENT_NAME.test(control.name) || PAYMENT_LABEL.test(control.name))) return true;
  if (control.href && isCheckoutUrl(control.href)) return true;
  if (control.formAction && isCheckoutUrl(control.formAction)) return true;
  return false;
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
