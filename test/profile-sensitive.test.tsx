// "Dados sensíveis" no perfil (toneorg/web#29): só aparece com o consentimento, e o botão retira a permissão.
import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Consent, Memory } from "../src/tone/shared";

vi.mock("posthog-js", () => ({ default: { capture: () => undefined } }));
const { api, ApiError } = await import("../src/conversas/api");
const { SensitiveDataView, consentRefusal } = await import("../src/conversas/SensitiveData");

afterEach(() => vi.unstubAllGlobals());

const granted: Consent = { purpose: "beleza_tom", textVersion: "2026-11-17", grantedAt: "2026-11-17T10:00:00.000Z", revokedAt: null };
const memory = (key: string, value: string): Memory =>
  ({ id: key, key, value, category: "beleza", source: "pessoa", inferred: false, condition: null }) as unknown as Memory;

function findButton(node: ReactNode, label: string): ReactElement<{ onClick: () => void }> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findButton(child, label);
      if (found) return found;
    }
    return null;
  }
  const element = node as ReactElement<{ children?: ReactNode; onClick?: () => void }>;
  if (element.type === "button" && JSON.stringify(element.props.children) === JSON.stringify(label))
    return element as ReactElement<{ onClick: () => void }>;
  return findButton(element.props?.children, label);
}

describe("seção Dados sensíveis do perfil", () => {
  it("não aparece sem consentimento nem com ele retirado", () => {
    const none = renderToStaticMarkup(<SensitiveDataView consents={[]} memories={[]} onRevoke={() => undefined} />);
    const revoked = renderToStaticMarkup(
      <SensitiveDataView consents={[{ ...granted, revokedAt: "2026-11-18T10:00:00.000Z" }]} memories={[]} onRevoke={() => undefined} />,
    );
    expect(none).toBe("");
    expect(revoked).toBe("");
  });

  it("com consentimento lista o que foi guardado, a finalidade e o botão", () => {
    const html = renderToStaticMarkup(
      <SensitiveDataView consents={[granted]} memories={[memory("beleza.tom", "médio"), memory("beleza.subtom", "quente")]} onRevoke={() => undefined} />,
    );
    expect(html).toContain("Dados sensíveis");
    expect(html).toContain("médio");
    expect(html).toContain("quente");
    expect(html).toContain("recomendar maquiagem");
    expect(html).toContain("Apagar e retirar permissão");
  });

  it("o botão pede para retirar a permissão", () => {
    const onRevoke = vi.fn();
    const tree = SensitiveDataView({ consents: [granted], memories: [], onRevoke });
    findButton(tree, "Apagar e retirar permissão")?.props.onClick();
    expect(onRevoke).toHaveBeenCalledOnce();
  });

  it("retirar chama DELETE /api/consents/beleza_tom pelo BFF", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, removed: 2 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await api.revokeConsent("beleza_tom");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/tone/consents/beleza_tom");
    expect(init.method).toBe("DELETE");
  });

  it("anotar uma chave sensível sem permissão mostra o texto do consentimento e não salva", async () => {
    const text = "Para lembrar do seu tom e subtom nas próximas compras de maquiagem, preciso da sua permissão. Uso só para recomendar maquiagem; você apaga quando quiser.";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ needsConsent: true, purpose: "beleza_tom", text, error: text }), { status: 409 })),
    );
    const failure = await api.addMemory("beleza.tom", "médio", "beleza").catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ApiError);
    expect(consentRefusal(failure)).toContain(text);
    expect(consentRefusal(failure)).toContain("Não guardei");
    expect(consentRefusal(new Error("x"))).toBeNull();
  });
});
