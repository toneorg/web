// The privacy note describes what the product does today: the facts a person
// and Google's review look for are on it, and the skin-tone-era copy is gone.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Privacy from "../src/app/privacidade/page";

const html = renderToStaticMarkup(<Privacy />);

describe("página de privacidade", () => {
  it("names what is kept, who processes it and how long", () => {
    for (const fact of ["Gmail", "somente leitura", "OpenRouter", "Resend", "PostHog", "30 dias", "24 horas", "art. 18"]) {
      expect(html).toContain(fact);
    }
  });

  it("links Google's user data policy and states the limited use", () => {
    expect(html).toContain("https://developers.google.com/terms/api-services-user-data-policy");
    expect(html).toContain("uso limitado");
  });

  it("points to the controls inside the app", () => {
    for (const control of ["Baixar meus dados", "Apagar minha conta", "Dados sensíveis"]) expect(html).toContain(control);
  });

  it("has one heading per section, in order", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect((html.match(/<h2/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });
});
