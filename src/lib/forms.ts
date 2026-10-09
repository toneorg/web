// The contract the forms and their server actions share: field names, the
// values each answer may take, and the shape of what gets saved. Imported by
// client components, so it carries no directive and nothing server-only.
// Reading and validating a submitted form lives in forms.server.ts.

import { MONK } from "./tones";

/**
 * Hidden trap field. Bots fill it; people never see it. The name is chosen so
 * no browser autofill maps it to something it knows, like a company or a URL.
 */
export const HONEYPOT_FIELD = "hp_leave_blank";

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "ref",
  "referrer",
] as const;

/** Which e-mail field on the page the signup came from. */
export const PLACEMENTS = ["topo", "fim"] as const;

/** Answer for "Não sei dizer" in the tone picker. */
export const TONE_UNKNOWN = "nd";

/** Every answer the tone picker can send: a band from "1" to "10", or "Não sei dizer". */
export const TONE_VALUES = [...MONK.map((_, i) => String(i + 1)), TONE_UNKNOWN] as const;

export const WRONG_SHADE_VALUES = ["nunca", "1-2", "3+", "desisti"] as const;
export const PLATFORMS = ["Shopify", "VTEX", "Nuvemshop", "Tray", "Outra", "Não sei"] as const;
export const PILOT_STEPS = ["conversa", "amostras", "piloto"] as const;

export type Placement = (typeof PLACEMENTS)[number];
export type WrongShade = (typeof WRONG_SHADE_VALUES)[number];
export type PilotStep = (typeof PILOT_STEPS)[number];

/*
  The `name` of every control, per form. Components write these as
  `"wrong_shade" satisfies ProfileField`, so a typo or a rename on one side is
  a type error instead of a column that silently goes blank.
*/
export type WaitlistField = "email" | "placement";

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

export type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  ref: string;
  referrer: string;
};

/** Step one: the e-mail alone puts someone on the list. */
type WaitlistRecord = {
  kind: "waitlist";
  email: string;
  placement: Placement | "";
} & Attribution;

/**
 * Step two, optional: the answers that help assemble the beta group. Saved as
 * its own row and matched to the waitlist row by e-mail.
 */
type ProfileRecord = {
  kind: "profile";
  email: string;
  /** A band "1" to "10", "nd" for "Não sei dizer", or empty when skipped. */
  tone: (typeof TONE_VALUES)[number] | "";
  foundation: string;
  wrongShade: WrongShade | "";
  wantsToTest: boolean;
  whatsapp: string;
} & Attribution;

type BrandRecord = {
  kind: "brand";
  name: string;
  email: string;
  brand: string;
  site: string;
  platform: (typeof PLATFORMS)[number] | "";
  steps: PilotStep[];
} & Attribution;

/**
 * One row in the submissions sheet. `suspect` marks a row whose trap field
 * came filled: almost always a bot, but kept so a person whose browser filled
 * it is not lost.
 */
export type Submission = (WaitlistRecord | ProfileRecord | BrandRecord) & { suspect?: true };

export type { BrandRecord, ProfileRecord, WaitlistRecord };
