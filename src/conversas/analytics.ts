"use client";
// Product analytics of the web app, in one place. Every event the web sends to
// PostHog is named here, so the list of what is measured can be read in one
// file (docs/analytics.md has the whole catalog, server events included).
//
// What never goes: what the person wrote (messages, memories, panel requests),
// e-mail, name, product titles. Only kinds, counts, durations and outcomes.
// The one exception is feedback, which the person writes to the team on purpose.
//
// The server also sends events for the same person id (message_sent,
// recommendation_shown, recommendation_clicked, $ai_generation, cost_recorded…),
// so a funnel can mix both.
import posthog from "posthog-js";

export type WebEvent =
  // Entry
  | "sign_in_completed"
  | "sign_in_failed"
  | "invite_checked"
  | "signed_out"
  // Onboarding
  | "onboarding_started"
  | "onboarding_step_viewed"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "onboarding_reopened"
  // Conversations
  | "conversation_started"
  | "conversation_opened"
  | "conversation_message_sent"
  | "conversation_turn_completed"
  | "conversation_turn_failed"
  | "conversation_turn_stopped"
  | "conversation_reply_selected"
  | "product_picked"
  | "product_unpicked"
  | "product_videos_requested"
  | "product_videos_failed"
  | "situation_outcome_recorded"
  // Research in the person's own Chrome (T14)
  | "local_research_opened"
  | "local_research_started"
  | "local_research_failed"
  | "local_research_stopped"
  // Decision board and watches drawn by the agent
  | "decision_changed"
  | "recommendation_rejected_clicked"
  | "watch_draft_saved"
  | "watch_draft_confirmed"
  // Panels (watches) on the left
  | "panel_create_opened"
  | "panel_planned"
  | "panel_plan_failed"
  | "panel_created"
  | "panel_action"
  | "panel_action_failed"
  // Profile and data
  | "memory_added"
  | "memory_confirmed"
  | "memory_deleted"
  | "memories_cleared"
  | "data_exported"
  | "account_deleted"
  | "watch_muted_by_link"
  // Feedback
  | "feedback_opened"
  | "feedback_submitted"
  | "feedback_failed"
  // Health
  | "api_request_failed";

type Value = string | number | boolean | null | undefined;

/** Sends one event. Safe without PostHog configured: posthog-js then does nothing. */
export function track(event: WebEvent, properties: Record<string, Value> = {}) {
  try {
    posthog.capture(event, { surface: "web", ...properties });
  } catch {
    // Analytics never break the app.
  }
}

/** The route of an API path without ids, so failures group by endpoint ("sessions/:id/transcript"). */
export function routeOf(path: string): string {
  return path
    .split("?")[0]
    .split("/")
    .map((part, index) => (index > 0 && /\d|^[A-Za-z0-9_-]{16,}$/.test(part) ? ":id" : part))
    .join("/");
}

/** Milliseconds since a `performance.now()` mark, rounded. */
export const since = (mark: number) => Math.round(performance.now() - mark);
