// A product tapped on a panel page ("Perguntar") goes with the conversation it opens: kept in the
// tab for the next screen, read once. Storage may be blocked; then the conversation opens without it.
// 20/11/2026: panels have no conversation of their own; the product goes to the single chat.
import { PickedProduct } from "@/tone/shared";

const key = (sessionId: string) => `tone:picked:${sessionId}`;

export function pickForSession(sessionId: string, product: PickedProduct): void {
  try {
    sessionStorage.setItem(key(sessionId), JSON.stringify(product));
  } catch {}
}

export function takePicked(sessionId: string): PickedProduct | null {
  try {
    const raw = sessionStorage.getItem(key(sessionId));
    if (!raw) return null;
    sessionStorage.removeItem(key(sessionId));
    const parsed = PickedProduct.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const CHAT = "tone:picked:chat";

/** The product goes to the single chat, whatever session it is on when it opens. */
export function pickForChat(product: PickedProduct): void {
  try {
    sessionStorage.setItem(CHAT, JSON.stringify(product));
  } catch {}
}

export function takeChatPicked(): PickedProduct | null {
  try {
    const raw = sessionStorage.getItem(CHAT);
    if (!raw) return null;
    sessionStorage.removeItem(CHAT);
    const parsed = PickedProduct.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
