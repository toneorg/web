// The e-mail a person gets right after joining the waiting list: "recebemos seu
// interesse". Sent through Resend (the provider the tone server already uses),
// from MAIL_FROM on the verified domain, with replies going to the contact
// address. The copy is in docs/copy/landing.md ("E-mail de confirmação").
//
// It is sent only after the entry is saved, keyed by the address: Resend keeps a
// key for 24 hours, so a double submit or a quick second sign-up sends it once.
// A failure never takes the person off the list; it is logged without the
// address.
import { createHash } from "node:crypto";
import { color, neutral } from "@toneorg/design";
import { SITE_URL } from "./site";

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 8000;

export const SUBJECT = "Recebemos seu interesse na tone";

const PARAGRAPHS = [
  "Seu e-mail está na lista de espera da tone. Estamos em teste fechado e os convites saem aos poucos, por ordem da lista. Quando o seu sair, você recebe outro e-mail com o link de entrada.",
  "Enquanto isso, a ideia é simples: você conta o que procura, a tone pesquisa nas lojas e volta com poucas opções, cada uma com o porquê. Ela não recebe de nenhuma marca para recomendar.",
  "Seu e-mail serve só para isso. Se não foi você que se inscreveu, é só ignorar esta mensagem.",
];

/** The plain text, which every mail client can read. */
export function confirmationText(): string {
  return ["Recebemos seu interesse.", "", ...PARAGRAPHS.flatMap((p) => [p, ""]), "tone", SITE_URL ?? ""].join("\n").trim();
}

/** The designed version: one column, the brand's serif for the heading, colours from the design tokens. */
export function confirmationHtml(): string {
  const ink = neutral.light.ink;
  const graphite = neutral.light.graphite;
  const paper = neutral.light.paper;
  const surface = neutral.light.surface;
  const accent = neutral.light.accentText;
  const serif = "'Crimson Pro', Georgia, 'Times New Roman', serif";
  const sans = "'Host Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const paragraphs = PARAGRAPHS.map(
    (p) => `<p style="margin:0 0 16px;font:400 16px/24px ${sans};color:${graphite}">${p}</p>`,
  ).join("");
  const site = SITE_URL
    ? `<a href="${SITE_URL}" style="color:${accent};text-decoration:underline">${SITE_URL.replace(/^https?:\/\//, "")}</a>`
    : "";
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${SUBJECT}</title></head>
<body style="margin:0;padding:0;background:${paper}">
<div style="display:none;max-height:0;overflow:hidden">Você está na lista de espera. Avisamos quando o seu convite sair.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper}">
<tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${surface};border-radius:28px">
<tr><td style="padding:40px 36px 32px">
<p style="margin:0 0 28px;font:500 28px/1 ${serif};letter-spacing:-0.04em;color:${ink}">tone</p>
<h1 style="margin:0 0 20px;font:400 34px/1.1 ${serif};letter-spacing:-0.015em;color:${ink}">Recebemos seu interesse.</h1>
${paragraphs}
<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${neutral.light.rule};font:400 14px/20px ${sans};color:${graphite}">
<span style="display:inline-block;width:8px;height:8px;border-radius:4px;background:${color.coral[500]};margin-right:8px"></span>Compre sem dúvida.${site ? ` · ${site}` : ""}
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** The same address gives the same key, whatever its case. */
export function idempotencyKey(email: string): string {
  return `waitlist-${createHash("sha256").update(email.trim().toLowerCase()).digest("hex")}`;
}

/** Sends the confirmation. Never throws: the entry is already saved. */
export async function sendWaitlistConfirmation(email: string): Promise<"sent" | "not_configured" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) {
    console.warn("leads: RESEND_API_KEY or MAIL_FROM is missing, the waiting list confirmation was not sent");
    return "not_configured";
  }
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "idempotency-key": idempotencyKey(email),
      },
      body: JSON.stringify({
        from,
        to: [email],
        // Read at send time, not import time: replies go to the contact address when there is one.
        ...(process.env.NEXT_PUBLIC_CONTACT_EMAIL ? { reply_to: process.env.NEXT_PUBLIC_CONTACT_EMAIL } : {}),
        subject: SUBJECT,
        text: confirmationText(),
        html: confirmationHtml(),
      }),
    });
    if (!response.ok) {
      console.error(`leads: Resend answered ${response.status} for a waiting list confirmation`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("leads: the waiting list confirmation could not be sent", error instanceof Error ? error.name : "unknown");
    return "failed";
  }
}
