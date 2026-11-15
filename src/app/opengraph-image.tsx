import { neutral } from "@toneorg/design";
import { ImageResponse } from "next/og";

export const alt = "tone: compre sem dúvida. A tone pesquisa nas lojas e recomenda poucas opções, com o porquê.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Black and white, like the site and the app.
const { paper: PAPER, surface: SURFACE, sunken: SUNKEN, ink: INK, onInk: ON_INK, graphite: GRAPHITE, rule: RULE } =
  neutral.light;

const WORDMARK = "tone";
const HEADLINE = ["Compre", "sem dúvida."];
// The same example the landing page shows, cut to what reads at thumbnail size.
// A no-break space keeps "R$" with its number.
const ASK = "Preciso de uma cadeira para trabalhar 8 horas por dia. Até R$ 1.500.";
const PICK = "Cadeira Apoio Pro";
const PRICE = "R$ 1.390";
const LABEL = "Eu escolheria";
const REASONS = ["O assento sobe até 54 cm", "Apoio lombar com ajuste", "Cabe no seu limite"];

/** A static cut of a Google font at one weight, subset to the glyphs it will set. */
async function loadFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(url);
  if (!css.ok) throw new Error(`Google Fonts answered ${css.status} for ${family}`);
  const src = (await css.text()).match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) throw new Error(`no TTF source for ${family}`);
  const file = await fetch(src[1]);
  if (!file.ok) throw new Error(`Google Fonts answered ${file.status} for the ${family} file`);
  return file.arrayBuffer();
}

/** Without the fonts the card still renders, in fallback faces; say so in the build log. */
function fallback(error: unknown) {
  console.warn("opengraph-image: font not loaded, using the fallback face.", error);
  return null;
}

export default async function Image() {
  const displayText = HEADLINE.join("") + WORDMARK + PICK;
  const sansText = ASK + PRICE + LABEL + REASONS.join("");
  const [light, medium, sans, sansMedium] = await Promise.all([
    loadFont("Crimson Pro", 300, displayText).catch(fallback),
    loadFont("Crimson Pro", 500, displayText).catch(fallback),
    loadFont("Host Grotesk", 400, sansText).catch(fallback),
    loadFont("Host Grotesk", 500, sansText).catch(fallback),
  ]);
  const fonts = [
    light && { name: "Crimson Pro", data: light, weight: 300 as const, style: "normal" as const },
    medium && { name: "Crimson Pro", data: medium, weight: 500 as const, style: "normal" as const },
    sans && { name: "Host Grotesk", data: sans, weight: 400 as const, style: "normal" as const },
    sansMedium && { name: "Host Grotesk", data: sansMedium, weight: 500 as const, style: "normal" as const },
  ].filter((font) => font !== null);
  const display = light && medium ? "Crimson Pro" : "serif";
  const body = sans && sansMedium ? "Host Grotesk" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          padding: "56px 64px 64px 72px",
          background: PAPER,
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontFamily: display, fontSize: 52, fontWeight: 500, letterSpacing: "-0.04em" }}>
            {WORDMARK}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: display,
              fontWeight: 300,
              fontSize: 108,
              lineHeight: 0.94,
              letterSpacing: "-0.025em",
            }}
          >
            {HEADLINE.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>

        <div
          style={{
            width: 480,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
            fontFamily: body,
          }}
        >
          <div
            style={{
              alignSelf: "flex-end",
              maxWidth: 420,
              padding: "18px 22px",
              borderRadius: "24px 24px 8px 24px",
              background: INK,
              color: ON_INK,
              fontSize: 22,
              lineHeight: 1.35,
            }}
          >
            {ASK}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              padding: "26px 28px",
              borderRadius: 28,
              background: SURFACE,
              border: `1px solid ${RULE}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 18, color: GRAPHITE }}>{LABEL}</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div style={{ fontFamily: display, fontWeight: 500, fontSize: 40, letterSpacing: "-0.02em" }}>{PICK}</div>
                <div style={{ fontSize: 22, fontWeight: 500 }}>{PRICE}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, borderTop: `1px solid ${SUNKEN}` }}>
              {REASONS.map((reason) => (
                <div key={reason} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 21 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: INK,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2.5 6.2 5 8.6l4.5-5" stroke={ON_INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {reason}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
