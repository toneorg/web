// The menu of a message (16/11/2026): a right click, the context-menu key or a long press opens it;
// Responder sends the message answered along, and the reply is drawn with its quote when reopened.
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TranscriptItem } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined } }));
const { itemsOf } = await import("../src/conversas/Conversation");
const { UserMessage } = await import("../src/conversas/StoreMention");
const { messageMenuHandlers } = await import("../src/conversas/MessageMenu");

const mouse = (x: number, y: number, contains = false) =>
  ({
    clientX: x,
    clientY: y,
    preventDefault: vi.fn(),
    currentTarget: { contains: () => contains },
  }) as unknown as React.MouseEvent;

describe("abrir o menu de uma mensagem", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("abre no clique direito, onde o ponteiro está, no lugar do menu do navegador", () => {
    vi.stubGlobal("window", { getSelection: () => null });
    const open = vi.fn();
    const event = mouse(120, 340);
    messageMenuHandlers(open).onContextMenu(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith({ x: 120, y: 340 });
  });

  it("deixa o menu do navegador quando há texto selecionado dentro da mensagem", () => {
    vi.stubGlobal("window", { getSelection: () => ({ isCollapsed: false, anchorNode: {} }) });
    const open = vi.fn();
    const event = mouse(10, 10, true);
    messageMenuHandlers(open).onContextMenu(event);
    expect(open).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("abre pela tecla de menu ou Shift+F10, no canto da mensagem", () => {
    const open = vi.fn();
    const target = { getBoundingClientRect: () => ({ left: 40, bottom: 200 }) };
    const key = (init: Partial<React.KeyboardEvent>) =>
      ({ preventDefault: vi.fn(), currentTarget: target, shiftKey: false, ...init }) as unknown as React.KeyboardEvent;
    messageMenuHandlers(open).onKeyDown(key({ key: "ContextMenu" }));
    messageMenuHandlers(open).onKeyDown(key({ key: "F10", shiftKey: true }));
    messageMenuHandlers(open).onKeyDown(key({ key: "Enter" }));
    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenCalledWith({ x: 52, y: 200 });
  });

  it("abre num toque longo, e não quando o dedo rola a conversa", () => {
    vi.useFakeTimers();
    const open = vi.fn();
    const handlers = messageMenuHandlers(open);
    const touch = (x: number, y: number) => ({ pointerType: "touch", clientX: x, clientY: y }) as React.PointerEvent;
    handlers.onPointerDown(touch(50, 60));
    handlers.onPointerMove(touch(50, 100));
    vi.advanceTimersByTime(600);
    expect(open).not.toHaveBeenCalled();
    // A render between the press and its end does not lose it: the press is kept outside the handlers.
    messageMenuHandlers(open).onPointerDown(touch(50, 60));
    vi.advanceTimersByTime(600);
    expect(open).toHaveBeenCalledWith({ x: 50, y: 60 });
  });
});

describe("resposta reaberta", () => {
  it("guarda a mensagem respondida e o id de cada mensagem da transcrição", () => {
    const replyTo = { sessionId: "s1", messageId: "42", role: "assistant" as const, text: "A fatura da Vivo vence amanhã." };
    const lines = TranscriptItem.array().parse([
      { kind: "assistant", text: "A fatura da Vivo vence amanhã.", messageId: "42" },
      { kind: "user", text: "sim, me lembra", replyTo, messageId: "43" },
    ]);
    const [answer] = itemsOf(lines[0] as TranscriptItem, "s1", 0);
    const [reply] = itemsOf(lines[1] as TranscriptItem, "s1", 1);
    expect(answer).toMatchObject({ kind: "assistant", messageId: "42" });
    expect(reply).toMatchObject({ kind: "user", text: "sim, me lembra", replyTo, messageId: "43" });
  });

  it("desenha a citação acima do texto; com a mensagem carregada, ela leva até lá", () => {
    const quote = { role: "assistant" as const, text: "A fatura da Vivo vence amanhã." };
    const still = renderToStaticMarkup(<UserMessage text="sim, me lembra" quote={quote} />);
    expect(still).toContain("Em resposta a: ");
    expect(still).toContain("A fatura da Vivo vence amanhã.");
    expect(still.indexOf("A fatura")).toBeLessThan(still.indexOf("sim, me lembra"));
    const linked = renderToStaticMarkup(<UserMessage text="sim" quote={{ ...quote, onOpen: () => undefined }} />);
    expect(linked).toContain('aria-label="Ir para a mensagem respondida: A fatura da Vivo vence amanhã."');
  });
});
