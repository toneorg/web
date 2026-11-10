// A product tapped on a panel page ("Perguntar") goes with the conversation it opens: kept in the
// tab for the next screen, read once. Storage may be blocked; then the conversation opens without it.
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
