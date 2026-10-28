// T06: the web's back end for front end. The browser only talks to this site,
// under /api/tone; this module repeats the request to the tone API from the
// server, with the session cookie and nothing else, and rewrites the cookie the
// API sets so it lives on this origin, HttpOnly. CORS is never involved, and no
// tone credential is ever readable by the page's JavaScript.

export const TONE_COOKIE = "tone_web";
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
const SEGMENT = /^[A-Za-z0-9_-]{1,80}$/;

/** The API routes the web may use, after /api/. Everything else (admin, extension sign-in) is refused here. */
const ALLOWED: RegExp[] = [
  /^auth\/web\/(link|redeem|email\/start|email\/verify)$/,
  /^auth\/(logout|link-codes|sessions)$/,
  /^auth\/sessions\/[^/]+$/,
  /^me(\/(budget|export|onboarded))?$/,
  /^memories(\/[^/]+)?$/,
  /^purchases$/,
  /^sessions$/,
  /^sessions\/[^/]+(\/(transcript|end|research-runs|decision))?$/,
  /^agent\/turn$/,
  /^research$/,
  /^watches$/,
  /^watches\/[^/]+(\/(confirm|pause|resume|check|mute|unmute|results))?$/,
  // T11: the mute link of an e-mail; the signed token is the only credential.
  /^watch-mute$/,
  /^events$/,
  // T14: the web asks for and follows local research; taking steps is the extension's (not listed).
  /^local-runs$/,
  /^local-runs\/[^/]+(\/stop)?$/,
  /^local-bridge$/,
];

export function upstreamPath(segments: string[]): string | null {
  if (!segments.length || segments.some((segment) => !SEGMENT.test(segment))) return null;
  const path = segments.join("/");
  return ALLOWED.some((pattern) => pattern.test(path)) ? `/api/${path}` : null;
}

/** Changes need the web header and a request from this site: a form or another site cannot send them. */
export function checkRequest(
  method: string,
  headers: Headers,
  siteUrl: string,
): { ok: true } | { ok: false; status: number; error: string } {
  if (SAFE.has(method)) return { ok: true };
  const refused = { ok: false as const, status: 403, error: "Pedido recusado." };
  if (headers.get("x-tone-web") !== "1") return refused;
  const origin = headers.get("origin");
  if (origin && origin !== new URL(siteUrl).origin) return refused;
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return refused;
  return { ok: true };
}

/** Only what the API needs: the tone cookie, the body type and the request id. */
export function upstreamHeaders(incoming: Headers): Headers {
  const out = new Headers({ "x-tone-web": "1" });
  for (const name of ["content-type", "accept", "x-request-id"]) {
    const value = incoming.get(name);
    if (value) out.set(name, value);
  }
  const cookie = (incoming.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${TONE_COOKIE}=`));
  if (cookie) out.set("cookie", cookie);
  return out;
}

/** The API's cookie, moved to this origin under /api/tone. Other cookies are dropped. */
export function rewriteSetCookie(value: string, secure: boolean): string | null {
  const [pair, ...attributes] = value.split(";").map((part) => part.trim());
  if (!pair?.startsWith(`${TONE_COOKIE}=`)) return null;
  const kept = attributes.filter((attribute) => /^(max-age|expires)=/i.test(attribute));
  return [pair, ...kept, "Path=/api/tone", "HttpOnly", "SameSite=Strict", ...(secure ? ["Secure"] : [])].join("; ");
}

export interface BffConfig {
  /** Where the tone API is, reached from this server. */
  apiUrl: string;
  /** This site's public address, for the origin check. */
  siteUrl: string;
}

export async function proxyToTone(request: Request, segments: string[], config: BffConfig): Promise<Response> {
  const path = upstreamPath(segments);
  if (!path) return Response.json({ error: "não encontrado" }, { status: 404 });
  const check = checkRequest(request.method, request.headers, config.siteUrl);
  if (!check.ok) return Response.json({ error: check.error }, { status: check.status });
  const url = new URL(path, config.apiUrl);
  url.search = new URL(request.url).search;
  let upstream: Response;
  try {
    upstream = await fetch(url.toString(), {
      method: request.method,
      headers: upstreamHeaders(request.headers),
      body: SAFE.has(request.method) ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "A tone não respondeu agora. Tente de novo em instantes." }, { status: 502 });
  }
  const headers = new Headers({ "cache-control": "no-store", "x-content-type-options": "nosniff" });
  for (const name of ["content-type", "content-disposition", "x-request-id"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const secure = new URL(config.siteUrl).protocol === "https:";
  for (const cookie of upstream.headers.getSetCookie()) {
    const rewritten = rewriteSetCookie(cookie, secure);
    if (rewritten) headers.append("set-cookie", rewritten);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
