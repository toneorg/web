import { neutral } from "@toneorg/design";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Crimson_Pro, Host_Grotesk } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
});

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "tone: compre sem dúvida",
    template: "%s | tone",
  },
  description:
    "A tone pesquisa nas lojas por você e volta com poucas opções, com o porquê de cada uma. Ela não recebe de nenhuma marca para recomendar. Em teste fechado, com lista de espera.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "tone",
  },
};

export const viewport: Viewport = {
  themeColor: neutral.light.paper,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${crimsonPro.variable} ${hostGrotesk.variable}`}>
      <body className="min-h-dvh bg-paper text-ink">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink"
        >
          Pular para o conteúdo
        </a>
        {children}
        {/* Page views only, without cookies. Collects nothing until enabled in the Vercel project. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
