// Gerado de toneorg/extension@ae98f09796c8 (packages/shared/src/api.ts). Não edite aqui.
// The REST shapes the panel and the server agree on.
import * as z from "zod";
import { BudgetStatement } from "./budget";

export const RedeemRequest = z.object({
  code: z.string().min(4).max(64),
  name: z.string().min(1).max(80),
  email: z.email().max(200),
  consent: z.literal(true),
  consentVersion: z.string(),
});
export type RedeemRequest = z.infer<typeof RedeemRequest>;

export const RedeemResponse = z.object({ token: z.string(), userId: z.string() });
export type RedeemResponse = z.infer<typeof RedeemResponse>;

export const MemorySource = z.enum(["conversa", "pergunta", "email", "agenda", "pessoa"]);
export type MemorySource = z.infer<typeof MemorySource>;

export const Memory = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  category: z.string(),
  source: MemorySource,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Memory = z.infer<typeof Memory>;

export const MemoryPatch = z.object({ value: z.string().min(1).max(200) });
export const MemoryCreate = z.object({
  key: z.string().min(1).max(60),
  value: z.string().min(1).max(200),
  category: z.string().min(1).max(30),
});

export const ConnectionProvider = z.enum(["gmail", "calendar"]);
export type ConnectionProvider = z.infer<typeof ConnectionProvider>;

export const ConnectionStatus = z.object({
  provider: ConnectionProvider,
  connected: z.boolean(),
  connectedAt: z.string().nullable(),
  lastSyncAt: z.string().nullable(),
  items: z.number().int(),
  available: z.boolean().describe("Whether the server has Google credentials configured."),
});
export type ConnectionStatus = z.infer<typeof ConnectionStatus>;

export const Me = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  onboarded: z.boolean(),
  spentTodayUsd: z.number(),
  dailyCapUsd: z.number(),
  budget: BudgetStatement.optional(),
  /** T16: the stores the server can search with a remote browser, for the web; empty when not configured. */
  remoteStores: z.array(z.string()).optional(),
});
export type Me = z.infer<typeof Me>;

export const SessionCreate = z.object({
  site: z.string().nullable(),
  onboarding: z.boolean().default(false),
});
export const SessionCreated = z.object({ sessionId: z.string(), greeting: z.string() });
export type SessionCreated = z.infer<typeof SessionCreated>;

/** A past conversation in the history list: only the ones where the person wrote something. */
export const SessionSummary = z.object({
  id: z.string(),
  /** The person's first message, cut short. */
  title: z.string(),
  site: z.string().nullable(),
  category: z.string().nullable(),
  onboarding: z.boolean(),
  startedAt: z.string(),
  lastAt: z.string(),
  /** How many messages the person wrote. */
  messages: z.number().int(),
  /** T06: where the conversation started; it continues on either surface. */
  surface: z.enum(["extension", "web"]).default("extension"),
});
export type SessionSummary = z.infer<typeof SessionSummary>;

export const Purchase = z.object({
  id: z.string(),
  merchant: z.string(),
  item: z.string(),
  price: z.number().nullable(),
  date: z.string().nullable(),
  source: z.string(),
});
export type Purchase = z.infer<typeof Purchase>;

/** The version of the consent text the person accepted. Bump it when the text changes. */
export const CONSENT_VERSION = "2026-10-18";

/** T05: where an access session was opened. The web keeps its credential in an HttpOnly cookie. */
export const AccessSurface = z.enum(["extension", "web"]);
export type AccessSurface = z.infer<typeof AccessSurface>;

/** A short code typed on the other surface; never sent in a URL. */
export const LinkCode = z
  .string()
  .trim()
  .toUpperCase()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^[A-HJ-NP-Z2-9]{8}$/, "Código de vínculo inválido."));
export const LinkCodeCreated = z.object({ code: z.string(), expiresAt: z.string() });
export type LinkCodeCreated = z.infer<typeof LinkCodeCreated>;
export const LinkRequest = z.object({ code: LinkCode });
export const EmailCodeStart = z.object({ email: z.email().max(200) });
export const EmailCodeVerify = z.object({ email: z.email().max(200), code: z.string().regex(/^\d{6}$/) });

export const AccessSession = z.object({
  id: z.string(),
  surface: AccessSurface,
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  current: z.boolean(),
});
export type AccessSession = z.infer<typeof AccessSession>;
