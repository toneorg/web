// A failed turn leaves a notice in the conversation (15/11/2026): reopened, it says why a message
// has no answer, drawn as an error but not announced again as the page loads.
import { describe, expect, it, vi } from "vitest";
import { TranscriptItem } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined } }));
const { itemsOf } = await import("../src/conversas/Conversation");

describe("a saved notice", () => {
  it("is read from the transcript and drawn as an error that is not announced on load", () => {
    const [saved] = TranscriptItem.array().parse([{ kind: "notice", text: "Algo deu errado do meu lado." }]);
    expect(itemsOf(saved as TranscriptItem)).toMatchObject([
      { kind: "notice", text: "Algo deu errado do meu lado.", error: true, saved: true },
    ]);
  });
});
