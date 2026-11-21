// Gerado de toneorg/server@4e74f96b4cd3 (packages/shared/src/consent.ts). Não edite aqui.
// Specific consent for sensitive data (LGPD, art. 11, I): skin tone and personal coloring can reveal
// racial or ethnic origin, so the tone keeps them in memory only after the person says yes to this
// text, for this purpose. A general consent does not cover it.
import * as z from "zod";

export const ConsentPurpose = z.enum(["beleza_tom"]);
export type ConsentPurpose = z.infer<typeof ConsentPurpose>;

/** The text the person agrees to, with its version: a new wording is a new version. */
export const SENSITIVE_CONSENT: Record<ConsentPurpose, { text: string; version: string; purpose: string }> = {
  beleza_tom: {
    text: "Para lembrar do seu tom e subtom nas próximas compras de maquiagem, preciso da sua permissão. Uso só para recomendar maquiagem; você apaga quando quiser.",
    version: "2026-11-17",
    purpose: "Recomendar maquiagem",
  },
};

/** The purpose a sensitive memory key belongs to. Every sensitive key today is about makeup. */
export const sensitivePurpose = (_key: string): ConsentPurpose => "beleza_tom";

/** Answers to a SensitiveConsent arrive under this prefix plus the purpose. */
export const SENSITIVE_CONSENT_PREFIX = "consentimento:";
export const SENSITIVE_CONSENT_ANSWERS = ["Pode guardar", "Só nesta conversa"] as const;

export const Consent = z.object({
  purpose: ConsentPurpose,
  textVersion: z.string(),
  grantedAt: z.string(),
  revokedAt: z.string().nullable(),
});
export type Consent = z.infer<typeof Consent>;

/** POST /api/memories refuses a sensitive key without consent with this body (status 409). */
export const NeedsConsent = z.object({
  needsConsent: z.literal(true),
  purpose: ConsentPurpose,
  text: z.string(),
  error: z.string(),
});
export type NeedsConsent = z.infer<typeof NeedsConsent>;
