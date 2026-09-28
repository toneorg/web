import { ImageResponse } from "next/og";
import { MONK } from "@/lib/tones";

export const alt =
  "tone: sua pele não é uma bolinha de cor. Os dez tons da escala Monk em faixas.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadArchivo(text: string) {
  const url = `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,800&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) return null;
  return (await fetch(src[1])).arrayBuffer();
}

export default async function Image() {
  const headline = "Sua pele não é uma bolinha de cor.";
  const font = await loadArchivo(`tone${headline}`).catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f3f3f2",
          color: "#292420",
          fontFamily: font ? "Archivo" : "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px 40px",
            flex: 1,
          }}
        >
          <div style={{ fontSize: 44, letterSpacing: "-0.05em" }}>tone</div>
          <div
            style={{
              fontSize: 84,
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              maxWidth: 1000,
            }}
          >
            {headline}
          </div>
        </div>
        <div style={{ display: "flex", height: 170 }}>
          {MONK.map((hex) => (
            <div key={hex} style={{ flex: 1, background: hex }} />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Archivo", data: font, weight: 800, style: "normal" }] : [],
    },
  );
}
