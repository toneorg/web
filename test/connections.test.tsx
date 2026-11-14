// Gmail and Agenda on the profile: connect, read again, disconnect, and the purchases read from e-mail.
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConnectionStatus, Purchase } from "../src/tone/shared";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));
const startConnection = vi.fn();
vi.mock("../src/conversas/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
  api: { startConnection: (...args: unknown[]) => startConnection(...args) },
}));
const { ConnectionsView, connect, failureText, outcomeOf } =
  await import("../src/conversas/Connections");
const { ApiError } = await import("../src/conversas/api");

afterEach(() => {
  vi.unstubAllGlobals();
  startConnection.mockReset();
});

const status = (
  overrides: Partial<ConnectionStatus> = {},
): ConnectionStatus => ({
  provider: "gmail",
  connected: false,
  connectedAt: null,
  lastSyncAt: null,
  items: 0,
  available: true,
  ...overrides,
});
const noop = () => undefined;
const draw = (props: Partial<Parameters<typeof ConnectionsView>[0]> = {}) =>
  renderToStaticMarkup(
    <ConnectionsView
      connections={[status(), status({ provider: "calendar" })]}
      purchases={[]}
      outcome={null}
      busy={null}
      onConnect={noop}
      onSync={noop}
      onDisconnect={noop}
      {...props}
    />,
  );

describe("conexões Google no perfil", () => {
  it("shows connect for a disconnected gmail", () => {
    const html = draw();
    expect(html).toContain("Conectar Gmail");
    expect(html).toContain("Conectar Agenda");
  });

  it("connect navigates to the google url", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { assign } });
    startConnection.mockResolvedValue({ url: "https://accounts.google.com/x" });
    await connect("gmail");
    expect(startConnection).toHaveBeenCalledWith("gmail");
    expect(assign).toHaveBeenCalledWith("https://accounts.google.com/x");
  });

  it("explica quando o servidor não tem o Google ativo (503)", async () => {
    startConnection.mockRejectedValue(new ApiError("indisponível", 503));
    await expect(connect("gmail")).rejects.toThrow(
      "ainda não estão ativas neste servidor",
    );
  });

  it("estado=ok shows a confirmation", () => {
    const outcome = outcomeOf("?conexao=gmail&estado=ok");
    const html = draw({ outcome });
    expect(html).toContain('role="status"');
    expect(html).toContain("Gmail conectado");
  });

  it("estado=cancelada shows nothing connected", () => {
    const outcome = outcomeOf("?conexao=calendar&estado=cancelada");
    expect(outcome?.text).toContain("Nada foi conectado");
    expect(draw({ outcome })).toContain("Nada foi conectado");
  });

  it("estado=erro e estado=expirado explicam o que fazer", () => {
    expect(outcomeOf("?conexao=gmail&estado=erro")?.text).toContain(
      "Não consegui conectar o Gmail",
    );
    expect(outcomeOf("?estado=expirado")?.text).toContain("O link expirou");
    expect(outcomeOf("?outra=coisa")).toBeNull();
  });

  it("mostra o que foi lido, com ler de novo e desconectar", () => {
    const html = draw({
      connections: [
        status({
          connected: true,
          items: 3,
          lastSyncAt: "2026-11-10T12:00:00.000Z",
        }),
        status({ provider: "calendar", available: false }),
      ],
    });
    expect(html).toContain("3 compras lidas");
    expect(html).toContain("Ler Gmail de novo");
    expect(html).toContain("Desconectar Gmail");
    expect(html).toContain("ainda não está disponível neste servidor");
  });

  it("lists purchases read from e-mail", () => {
    const purchases: Purchase[] = [
      {
        id: "p1",
        merchant: "Amazon",
        item: "Fone Bluetooth",
        price: 199.9,
        date: "2026-10-02",
        source: "gmail",
      },
      {
        id: "p2",
        merchant: "Dior",
        item: "Sauvage Elixir",
        price: null,
        date: null,
        source: "gmail",
      },
    ];
    const html = draw({ purchases });
    expect(html).toContain("Fone Bluetooth");
    expect(html).toContain("Sauvage Elixir");
  });

  it("mantém o aviso de status sempre na página, vazio quando não há mensagem", () => {
    expect(draw()).toMatch(/<p role="status"[^>]*><\/p>/);
  });

  it("troca o código de erro 5xx por uma frase, e mantém a mensagem do servidor", () => {
    expect(failureText(new ApiError("Erro 502", 502))).toBe(
      "Não consegui agora. Tente de novo em instantes.",
    );
    expect(failureText(new ApiError("O Gmail não respondeu.", 502))).toBe(
      "O Gmail não respondeu.",
    );
  });

  it("desconectar sem itens não fala de contagem", () => {
    expect(
      draw({ connections: [status({ connected: true, items: 0 })] }),
    ).toContain("Desconectar Gmail");
  });
});
