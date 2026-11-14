// The two forms of the public pages: the person's waiting list (/) and the
// store's pilot request (/lojas). This server has no database, so each entry is
// forwarded, from the server, to the URL in LEADS_WEBHOOK_URL (a sheet, an
// automation, the tone server). Without it the routes answer 503 and the forms
// say so, with the contact e-mail.
import { z } from "zod";

export const PLATFORMS = ["Nuvemshop", "Shopify", "VTEX", "WooCommerce", "Tray", "Loja Integrada", "Outra"] as const;
export const TRAFFIC = ["Menos de 10 mil", "10 mil a 50 mil", "50 mil a 300 mil", "Mais de 300 mil"] as const;

/** A field that bots fill and people never see. Present and non-empty = drop silently. */
const trap = z.string().max(0).optional();

export const WaitlistEntry = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().trim().max(64).optional(),
  website: trap,
});

export const PilotRequest = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  store: z.string().trim().min(4).max(200),
  platform: z.enum(PLATFORMS),
  traffic: z.enum(TRAFFIC),
  whatsapp: z.string().trim().max(32).optional(),
  website: trap,
});

type Kind = "waitlist" | "pilot";

/** Validates the body and forwards it. Returns the response the route sends. */
export async function receive(kind: Kind, request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const schema = kind === "waitlist" ? WaitlistEntry : PilotRequest;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "website") return Response.json({ ok: true }); // a bot: pretend it worked
    return Response.json({ error: "invalid", field: typeof field === "string" ? field : null }, { status: 422 });
  }
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return Response.json({ error: "not_configured" }, { status: 503 });

  const { website: _trap, ...data } = parsed.data;
  void _trap;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, ...data, receivedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error(`leads: the webhook answered ${response.status} for a ${kind} entry`);
      return Response.json({ error: "upstream" }, { status: 502 });
    }
  } catch (error) {
    console.error(`leads: the webhook failed for a ${kind} entry`, error);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
