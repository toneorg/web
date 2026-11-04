"use client";
// The conversa de boas-vindas (optional): five quick questions, one at a time, that
// become memory. The server already runs it for a session made with `onboarding`;
// the web only offers the door, on the start page while the tone knows little, and
// always from the profile. "Agora não" is remembered on this browser.
import { api } from "./api";

/** What opens the conversation: the tone asks the first question as soon as it opens. */
export const WELCOME_FIRST = "Pode começar.";
/** Below this many memories the start page still offers the conversation. */
export const WELCOME_MEMORY_FLOOR = 3;

const key = (userId: string) => `tone.welcome-chat.v1.${userId}`;

export function welcomeDismissed(userId: string): boolean {
  try {
    return window.localStorage.getItem(key(userId)) === "dismissed";
  } catch {
    return false;
  }
}

export function dismissWelcome(userId: string): void {
  try {
    window.localStorage.setItem(key(userId), "dismissed");
  } catch {
    // Without storage the offer comes back next time; nothing else depends on it.
  }
}

/** Creates the conversation and gives the address that opens it already asking. */
export async function startWelcomeChat(): Promise<string> {
  const { sessionId } = await api.newSession(true);
  return `/conversas/${sessionId}?primeira=${encodeURIComponent(WELCOME_FIRST)}`;
}
