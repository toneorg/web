// Gerado de toneorg/extension@7b352c6fb2e6 (packages/shared/src/local-run.ts). Não edite aqui.
// T14: a local research run. The web asks the server for a short, scoped run;
// the extension of the same account takes its steps with its own token, runs
// them in its one work tab and posts back only product data. The web page never
// sees the extension's credential, and the extension never runs a command the
// server did not hand it for this account, store and time window.
import * as z from "zod";
import { PageSnapshot } from "./page";

/** Stores the extension can read locally (its adapters). */
export const LOCAL_STORES = ["amazon.com.br", "mercadolivre.com.br"] as const;
export const LocalStore = z.enum(LOCAL_STORES);
export type LocalStore = z.infer<typeof LocalStore>;

export const LocalStep = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("search"), store: LocalStore, query: z.string().trim().min(1).max(120) }),
  z.object({ kind: z.literal("open_product"), store: LocalStore, url: z.url() }),
]);
export type LocalStep = z.infer<typeof LocalStep>;

export const LocalRunRequest = z.object({
  sessionId: z.string().min(1),
  query: z.string().trim().min(1).max(120),
  stores: z.array(LocalStore).min(1).max(2),
});

export const LocalRunStatus = z.enum(["pending", "running", "done", "stopped", "suspended", "expired"]);
export type LocalRunStatus = z.infer<typeof LocalRunStatus>;

export const LocalRun = z.object({
  id: z.string(),
  sessionId: z.string(),
  status: LocalRunStatus,
  query: z.string(),
  stores: z.array(LocalStore),
  steps: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      step: LocalStep,
      state: z.enum(["pending", "done", "failed"]),
      error: z.string().nullable(),
    }),
  ),
  /** Why a run stopped before its end, in Portuguese. */
  reason: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string(),
});
export type LocalRun = z.infer<typeof LocalRun>;

/** The next command for the extension, or nothing to do. */
export const LocalNext = z.object({
  runId: z.string(),
  expiresAt: z.string(),
  index: z.number().int().nonnegative(),
  step: LocalStep,
  /** True for the first step of a run: only then may the extension open a work tab if it has none. */
  first: z.boolean(),
});
export type LocalNext = z.infer<typeof LocalNext>;

/** Why the extension stopped a run on its own. */
export const LocalSuspension = z.enum(["tab_closed", "person_took_over", "out_of_scope", "revoked"]);
export type LocalSuspension = z.infer<typeof LocalSuspension>;

export const LocalStepResult = z.object({
  ok: z.boolean(),
  snapshot: PageSnapshot.nullable(),
  error: z.string().max(300).nullable(),
  suspended: LocalSuspension.nullable(),
});
export type LocalStepResult = z.infer<typeof LocalStepResult>;

/** The web page's nudge to the extension: an id to fetch from the server, nothing else. */
export const LocalNudge = z.object({ type: z.literal("tone.local_run"), runId: z.string().min(1).max(60) });

/** Keeps only what a comparison needs from a page: no descriptions, reviews, specs or page text. */
export function minimalSnapshot(snapshot: PageSnapshot): PageSnapshot {
  return {
    ...snapshot,
    products: snapshot.products.slice(0, 12).map((product) => ({ ...product })),
    filters: [],
    product: snapshot.product
      ? {
          ...snapshot.product,
          description: null,
          specs: [],
          reviewSamples: [],
          ratingHistogram: null,
          variants: [],
          images: snapshot.product.images.slice(0, 1),
          addToCartRef: null,
        }
      : null,
  };
}
