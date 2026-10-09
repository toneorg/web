import { color } from "@toneorg/design";
import { ImageResponse } from "next/og";

export const alt = "tone: antes de comprar, me manda o link.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CORAL = color.coral[500];
const WINE = color.wine[900];

const WORDMARK = "tone";
const HEADLINE_WEIGHT = 300;
const WORDMARK_WEIGHT = 500;

/** A static cut of the display face at one weight, subset to the glyphs it will set. */
async function loadCrimsonPro(text: string, weight: number) {
  const url = `https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(url);
  if (!css.ok) throw new Error(`Google Fonts answered ${css.status} for the stylesheet`);
  const src = (await css.text()).match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) throw new Error("no TTF source in the Google Fonts stylesheet");
  const file = await fetch(src[1]);
  if (!file.ok) throw new Error(`Google Fonts answered ${file.status} for the font file`);
  return file.arrayBuffer();
}

/** Without the font the card still renders, in a fallback serif; say so in the build log. */
function fallback(error: unknown) {
  console.warn("opengraph-image: Crimson Pro not loaded, using the fallback serif.", error);
  return null;
}

export default async function Image() {
  const lines = ["Antes de comprar,", "me manda o link."];
  // Headline light, wordmark medium: the same two weights the page uses.
  const [light, medium] = await Promise.all([
    loadCrimsonPro(lines.join(""), HEADLINE_WEIGHT).catch(fallback),
    loadCrimsonPro(WORDMARK, WORDMARK_WEIGHT).catch(fallback),
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
