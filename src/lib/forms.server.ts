import "server-only";

// Reads and validates what the three forms submit. Server-only: the regex,
// the error copy and the parsing never ship to the browser.

import {
  type Attribution,
  type BrandField,
  type BrandRecord,
  type FieldErrors,
  type PilotStep,
  type ProfileField,
  type ProfileRecord,
  type WaitlistField,
  type WaitlistRecord,
  ATTRIBUTION_KEYS,
  HONEYPOT_FIELD,
  PILOT_STEPS,
  PLACEMENTS,
  PLATFORMS,
  TONE_VALUES,
  WRONG_SHADE_VALUES,
} from "./forms";

export type Parsed<F extends string, R> =
  | { ok: true; record: R }
  | { ok: false; errors: FieldErrors<F> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_ERROR = "Confira o e-mail: falta o @ ou o final, como .com.";

/** Typed, trimmed and length-capped reads from a submitted form. */
function reader<F extends string>(form: FormData) {
  const field = (key: F | (typeof ATTRIBUTION_KEYS)[number], max = 200) =>
    String(form.get(key) ?? "")
      .trim()
      .slice(0, max);
  const checked = (key: F) => form.get(key) === "on";
  return { field, checked };
}

/** The value when it is one of the allowed answers, empty otherwise. */
function oneOf<const T extends readonly string[]>(value: string, options: T): T[number] | "" {
  return (options as readonly string[]).includes(value) ? (value as T[number]) : "";
}

function invalid<F extends string>(errors: FieldErrors<F>): { ok: false; errors: FieldErrors<F> } | null {
  return Object.keys(errors).length ? { ok: false, errors } : null;
}

/** Whether the trap field came filled. */
export function isSuspect(form: FormData): boolean {
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
  const answeredTone = field("tone", 4);
  const tone = oneOf(answeredTone, TONE_VALUES);
  const wantsToTest = checked("test");
  const whatsapp = field("whatsapp", 30);

  const errors: FieldErrors<ProfileField> = {};
  // The e-mail is carried over from step one; without it the row could not
  // be matched to anyone.
  if (!EMAIL.test(email))
    errors.email = "Perdemos o seu e-mail. Recarregue a página e entre na lista de novo.";
  if (answeredTone && !tone) errors.tone = "Escolha uma das dez faixas, ou “Não sei dizer”.";
  if (wantsToTest && whatsapp.replace(/\D/g, "").length < 10)
    errors.whatsapp = "Digite o WhatsApp com DDD para combinarmos o teste.";
  if (!checked("consent"))
    errors.consent = "Sem a sua autorização não podemos guardar estas respostas.";

  return (
    invalid(errors) ?? {
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
    }
  );
}

export function parseBrand(form: FormData): Parsed<BrandField, BrandRecord> {
  const { field, checked } = reader<BrandField>(form);
  const name = field("name", 120);
  const email = field("email", 160).toLowerCase();
  const brand = field("brand", 120);
  const steps = form
    .getAll("steps" satisfies BrandField)
    .map(String)
    .filter((step): step is PilotStep => (PILOT_STEPS as readonly string[]).includes(step));

  const errors: FieldErrors<BrandField> = {};
  if (!name) errors.name = "Digite seu nome.";
  if (!EMAIL.test(email)) errors.email = EMAIL_ERROR;
  if (!brand) errors.brand = "Digite o nome da marca.";
  if (!steps.length) errors.steps = "Escolha pelo menos um passo, mesmo que seja só a conversa.";
  if (!checked("consent")) errors.consent = "Sem a sua autorização não podemos entrar em contato.";

  return (
    invalid(errors) ?? {
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
    }
  );
}
