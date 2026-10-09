// The contract between the forms and their server actions: field names,
// allowed option values, validation and the saved record shape. Imported by
// client components and by src/app/actions.ts, so it carries no directive.

import { MONK } from "./tones";

/** Hidden trap field. Never give a real field this name. */
export const HONEYPOT_FIELD = "company";

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "ref",
  "referrer",
] as const;

/** Answer for "Não sei dizer" in the tone picker. */
export const TONE_UNKNOWN = "nd";

/** Which e-mail field on the page the signup came from. */
export const PLACEMENTS = ["topo", "fim"] as const;

export const WRONG_SHADE_VALUES = ["nunca", "1-2", "3+", "desisti"] as const;
export const PLATFORMS = ["Shopify", "VTEX", "Nuvemshop", "Tray", "Outra", "Não sei"] as const;
export const PILOT_STEPS = ["conversa", "amostras", "piloto"] as const;

export type Placement = (typeof PLACEMENTS)[number];
export type WrongShade = (typeof WRONG_SHADE_VALUES)[number];
export type PilotStep = (typeof PILOT_STEPS)[number];

export type WaitlistField = "email";

export type ProfileField =
  | "email"
  | "tone"
  | "foundation"
  | "wrong_shade"
  | "test"
  | "whatsapp"
  | "consent";

export type BrandField =
  | "name"
  | "email"
  | "brand"
  | "site"
  | "platform"
  | "steps"
  | "consent";

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

export type FormState<F extends string> =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: FieldErrors<F> }
  | { status: "ok" };

type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  ref: string;
  referrer: string;
};

/** Step one: the e-mail alone puts someone on the list. */
export type WaitlistRecord = {
  kind: "waitlist";
  email: string;
  placement: Placement | "";
} & Attribution;

/**
 * Step two, optional: the answers that help assemble the beta group. Saved as
 * its own row and matched to the waitlist row by e-mail.
 */
export type ProfileRecord = {
  kind: "profile";
  email: string;
  tone: string;
  foundation: string;
  wrongShade: WrongShade | "";
  wantsToTest: boolean;
  whatsapp: string;
} & Attribution;

export type BrandRecord = {
  kind: "brand";
  name: string;
  email: string;
  brand: string;
  site: string;
  platform: (typeof PLATFORMS)[number] | "";
  steps: PilotStep[];
} & Attribution;

/** One row in the submissions sheet. */
export type Submission = WaitlistRecord | ProfileRecord | BrandRecord;

export type Parsed<F extends string, R> =
  | { ok: true; record: R }
  | { ok: false; errors: FieldErrors<F> };

/** Tone number 1–10 from a picker answer, or null for "Não sei dizer" and anything else. */
export function toneNumber(answer: string): number | null {
  const n = Number(answer);
  return Number.isInteger(n) && n >= 1 && n <= MONK.length ? n : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_ERROR = "Confira o e-mail: falta o @ ou o final, como .com.";

/** Typed, trimmed and length-capped reads from a submitted form. */
function reader<F extends string>(form: FormData) {
  const field = (key: F | (typeof ATTRIBUTION_KEYS)[number] | "placement", max = 200) =>
    String(form.get(key) ?? "")
      .trim()
      .slice(0, max);
  const checked = (key: F) => form.get(key) === "on";
  return { field, checked };
}

function oneOf<const T extends readonly string[]>(value: string, options: T): T[number] | "" {
  return (options as readonly string[]).includes(value) ? (value as T[number]) : "";
}

export function isBot(form: FormData): boolean {
  return String(form.get(HONEYPOT_FIELD) ?? "") !== "";
}

function attribution(form: FormData): Attribution {
  const { field } = reader<never>(form);
  return {
    utmSource: field("utm_source", 80),
    utmMedium: field("utm_medium", 80),
    utmCampaign: field("utm_campaign", 80),
    ref: field("ref", 80),
    referrer: field("referrer", 300),
  };
}

export function parseWaitlist(form: FormData): Parsed<WaitlistField, WaitlistRecord> {
  const { field } = reader<WaitlistField>(form);
  const email = field("email", 160).toLowerCase();

  if (!EMAIL.test(email)) return { ok: false, errors: { email: EMAIL_ERROR } };

  return {
    ok: true,
    record: {
      kind: "waitlist",
      email,
      placement: oneOf(field("placement", 10), PLACEMENTS),
      ...attribution(form),
    },
  };
}

export function parseProfile(form: FormData): Parsed<ProfileField, ProfileRecord> {
  const { field, checked } = reader<ProfileField>(form);
  const email = field("email", 160).toLowerCase();
  const tone = field("tone", 4);
  const wantsToTest = checked("test");
  const whatsapp = field("whatsapp", 30);

  const errors: FieldErrors<ProfileField> = {};
  // The e-mail is carried over from step one; without it the row could not
  // be matched to anyone.
  if (!EMAIL.test(email))
    errors.email = "Perdemos o seu e-mail. Recarregue a página e entre na lista de novo.";
  if (tone && tone !== TONE_UNKNOWN && toneNumber(tone) === null)
    errors.tone = "Escolha uma das dez faixas, ou “Não sei dizer”.";
  if (wantsToTest && whatsapp.replace(/\D/g, "").length < 10)
    errors.whatsapp = "Digite o WhatsApp com DDD para combinarmos o teste.";
  if (!checked("consent"))
    errors.consent = "Sem a sua autorização não podemos guardar estas respostas.";
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    record: {
      kind: "profile",
      email,
      tone,
      foundation: field("foundation", 120),
      wrongShade: oneOf(field("wrong_shade", 20), WRONG_SHADE_VALUES),
      wantsToTest,
      whatsapp: wantsToTest ? whatsapp : "",
      ...attribution(form),
    },
  };
}

export function parseBrand(form: FormData): Parsed<BrandField, BrandRecord> {
  const { field, checked } = reader<BrandField>(form);
  const name = field("name", 120);
  const email = field("email", 160).toLowerCase();
  const brand = field("brand", 120);
  const steps = form
    .getAll("steps")
    .map(String)
    .filter((s): s is PilotStep => (PILOT_STEPS as readonly string[]).includes(s));

  const errors: FieldErrors<BrandField> = {};
  if (!name) errors.name = "Digite seu nome.";
  if (!EMAIL.test(email)) errors.email = EMAIL_ERROR;
  if (!brand) errors.brand = "Digite o nome da marca.";
  if (!steps.length) errors.steps = "Escolha pelo menos um passo, mesmo que seja só a conversa.";
  if (!checked("consent")) errors.consent = "Sem a sua autorização não podemos entrar em contato.";
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    record: {
      kind: "brand",
      name,
      email,
      brand,
      site: field("site", 200),
      platform: oneOf(field("platform", 40), PLATFORMS),
      steps: [...new Set(steps)],
      ...attribution(form),
    },
  };
}
