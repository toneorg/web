"use client";
// The conversa de boas-vindas (optional): five quick questions, one at a time, that
// become memory. The server already runs it for a session made with `onboarding`;
// the web only offers the door: in the empty chat while the tone knows little, and
// always from the profile. The chat opens that session and sends WELCOME_FIRST
// (Conversation.tsx). "Agora não" is remembered on this browser.

/** What opens the conversation: the tone asks the first question as soon as it opens. */
export const WELCOME_FIRST = "Pode começar.";
/** Below this many memories the empty chat still offers the conversation. */
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
