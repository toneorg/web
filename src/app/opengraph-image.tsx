import { ImageResponse } from "next/og";

export const alt = "tone: antes de comprar, me manda o link.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Keep in sync with --color-coral and --color-wine in globals.css.
const CORAL = "#e26b5c";
const WINE = "#340b10";

const WORDMARK = "tone";
const HEADLINE_WEIGHT = 300;
const WORDMARK_WEIGHT = 500;

/** A static cut of the display face at one weight, subset to the glyphs it will set. */
async function loadCrimsonPro(text: string, weight: number) {
  const url = `https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) return null;
  return (await fetch(src[1])).arrayBuffer();
}

export default async function Image() {
  const lines = ["Antes de comprar,", "me manda o link."];
  // Headline light, wordmark medium: the same two weights the page uses.
  const [light, medium] = await Promise.all([
    loadCrimsonPro(lines.join(""), HEADLINE_WEIGHT).catch(() => null),
    loadCrimsonPro(WORDMARK, WORDMARK_WEIGHT).catch(() => null),
  ]);
  const loaded = light && medium;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px 64px",
          background: CORAL,
          color: WINE,
          fontFamily: loaded ? "Crimson Pro" : "serif",
          fontWeight: HEADLINE_WEIGHT,
        }}
      >
        <div style={{ fontSize: 52, fontWeight: WORDMARK_WEIGHT, letterSpacing: "-0.04em" }}>
          {WORDMARK}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 132,
            lineHeight: 0.94,
            letterSpacing: "-0.025em",
          }}
        >
          {lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: loaded
        ? [
            { name: "Crimson Pro", data: light, weight: HEADLINE_WEIGHT, style: "normal" },
            { name: "Crimson Pro", data: medium, weight: WORDMARK_WEIGHT, style: "normal" },
          ]
        : [],
    },
  );
}
