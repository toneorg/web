// The single chat (15/11/2026): one conversation like a messaging app, its day separators, the
// silent new session after a pause, the old links and the search of messages.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TranscriptItem } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined } }));
const { dayLabel, dayStarts, lineKey, SESSION_GAP_MS, startsNewSession, targetFromSearch } = await import(
  "../src/conversas/timeline"
);
const { itemsOf } = await import("../src/conversas/Conversation");
const { Highlighted, whenSaid } = await import("../src/conversas/Search");

describe("conversa única", () => {
  it("opens a new session only after a pause", () => {
    const now = Date.parse("2026-11-15T18:00:00.000Z");
    expect(startsNewSession(null, now)).toBe(true);
    expect(startsNewSession(new Date(now - 60_000).toISOString(), now)).toBe(false);
    expect(startsNewSession(new Date(now - SESSION_GAP_MS + 1000).toISOString(), now)).toBe(false);
    expect(startsNewSession(new Date(now - SESSION_GAP_MS).toISOString(), now)).toBe(true);
    expect(startsNewSession("não é data", now)).toBe(true);
  });

  it("names the days in Brazil: hoje, ontem, a date, the year when it is another", () => {
    const now = new Date("2026-11-15T18:00:00.000Z");
    expect(dayLabel("2026-11-15T12:00:00.000Z", now)).toBe("Hoje");
    // 01:00 UTC on the 15th is still the 14th in São Paulo.
    expect(dayLabel("2026-11-15T01:00:00.000Z", now)).toBe("Ontem");
    expect(dayLabel("2026-11-02T15:00:00.000Z", now)).toBe("2 de novembro");
    expect(dayLabel("2025-12-24T15:00:00.000Z", now)).toBe("24 de dezembro de 2025");
  });

  it("puts a separator where the day changes; a line without time stays in its day", () => {
    const starts = dayStarts([
      { at: "2026-11-14T15:00:00.000Z" },
      {},
      { at: "2026-11-14T16:00:00.000Z" },
      { at: "2026-11-15T15:00:00.000Z" },
      {},
    ]);
    expect([...starts.keys()]).toEqual([0, 3]);
  });

  it("keys saved lines by session and transcript position, the address a search result points at", () => {
    const lines = TranscriptItem.array().parse([
      { kind: "assistant", text: "Oi!", at: "2026-11-15T12:00:00.000Z" },
      { kind: "user", text: "um tênis", at: "2026-11-15T12:01:00.000Z" },
    ]);
    const items = lines.flatMap((line, index) => itemsOf(line, "s1", index));
    expect(items.map((item) => [item.id, item.session, item.at, item.old])).toEqual([
      [lineKey("s1", 0), "s1", "2026-11-15T12:00:00.000Z", true],
      [lineKey("s1", 1), "s1", "2026-11-15T12:01:00.000Z", true],
    ]);
  });

  it("reads old conversation links and refuses odd ones", () => {
    expect(targetFromSearch("?em=abc-123")).toEqual({ sessionId: "abc-123" });
    expect(targetFromSearch("?em=abc&linha=4")).toEqual({ sessionId: "abc", index: 4 });
    expect(targetFromSearch("?em=abc&linha=-1")).toEqual({ sessionId: "abc" });
    expect(targetFromSearch("?em=../x")).toBeNull();
    expect(targetFromSearch("?perfil=1")).toBeNull();
  });
});

describe("busca de mensagens", () => {
  it("marks every word of the search, accents and case aside", () => {
    const html = renderToStaticMarkup(<Highlighted text="O Tênis de corrida mais leve" query="tenis LEVE" />);
    expect(html).toContain("O <mark");
    expect(html).toMatch(/<mark[^>]*>Tênis<\/mark>/);
    expect(html).toMatch(/<mark[^>]*>leve<\/mark>/);
    expect(renderToStaticMarkup(<Highlighted text="nada aqui" query="sandália" />)).toBe("nada aqui");
  });

  it("says when a match was said", () => {
    expect(whenSaid(new Date().toISOString())).toMatch(/^Hoje, \d{2}:\d{2}$/);
  });
});
