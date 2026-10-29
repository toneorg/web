// Gerado de toneorg/extension@bc3273ad0a23 (packages/shared/src/api.ts). Não edite aqui.
// The REST shapes the panel and the server agree on.
import * as z from "zod";
import { BudgetStatement } from "./budget";

/** The shortest password an account takes. */
export const PASSWORD_MIN = 8;
export const Password = z.string().min(PASSWORD_MIN).max(200);

/**
 * The first entry: the invite code, then the onboarding that sets the name and the
 * password. After it, the person enters with e-mail and password only.
 */
export const RedeemRequest = z.object({
  code: z.string().min(4).max(64),
  name: z.string().min(1).max(80),
  email: z.email().max(200),
  password: Password,
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
  /** Conditional memory: the situation in which this holds ("casamento", "trabalho", "viagem"); null when always. */
  condition: z.string().nullable().default(null),
  /** A hypothesis the tone inferred and the person has not confirmed yet. */
  inferred: z.boolean().default(false),
  /** Temporary state ("economizando este mês"): after this instant it no longer reaches the agent. */
  expiresAt: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Memory = z.infer<typeof Memory>;

/** Things the person already has live in memory under this category: a light wardrobe, no catalog. */
export const OWNED_CATEGORY = "tenho";

/**
 * Answers to a MemoryCheck arrive under this prefix plus the memory key, and answers to an
 * OutcomeCheck under the other plus the situation id, so a plain "Sim" to a chip question
 * is never mistaken for a verdict.
 */
export const MEMORY_CHECK_PREFIX = "confirmar:";
export const OUTCOME_CHECK_PREFIX = "ocasiao:";
export const MEMORY_CHECK_ANSWERS = ["Sim", "Mais ou menos", "Não"] as const;

export const MemoryPatch = z.object({ value: z.string().min(1).max(200) });
export const MemoryCreate = z.object({
  key: z.string().min(1).max(60),
  value: z.string().min(1).max(200),
  category: z.string().min(1).max(30),
  condition: z.string().min(1).max(60).nullable().optional(),
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

/** What an invite code opens: the e-mail it was made for, and whether that e-mail already has an account. */
export const InviteCheck = z.object({ code: z.string().min(4).max(64) });
export const InviteInfo = z.object({ email: z.string().nullable(), existing: z.boolean() });
export type InviteInfo = z.infer<typeof InviteInfo>;

/** Entering an existing account, on either surface. */
export const SignInRequest = z.object({ email: z.email().max(200), password: z.string().min(1).max(200) });
export type SignInRequest = z.infer<typeof SignInRequest>;

export const AccessSession = z.object({
  id: z.string(),
  surface: AccessSurface,
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  current: z.boolean(),
});
export type AccessSession = z.infer<typeof AccessSession>;
