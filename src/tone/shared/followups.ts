// Gerado de toneorg/server@849a02b9f532 (packages/shared/src/followups.ts). Não edite aqui.
// Motor de descoberta, segunda fase: when the slow stores of a search finish after the answer and
// bring something that would be among the first four, the conversation gets one more message from
// tone with those products. The web asks for these after each turn, while one is still pending.
import * as z from "zod";
import { TranscriptItem } from "./agent";

export const FollowUpStatus = z.enum(["pending", "working", "shown", "none", "failed"]);
export type FollowUpStatus = z.infer<typeof FollowUpStatus>;

export const DiscoveryFollowUp = z.object({
  /** The research the follow-up belongs to. */
  id: z.string(),
  status: FollowUpStatus,
  updatedAt: z.string(),
  /** The message written in the conversation, once shown; the transcript has it as well. */
  line: TranscriptItem.nullable(),
});
export type DiscoveryFollowUp = z.infer<typeof DiscoveryFollowUp>;
