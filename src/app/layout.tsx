import { color } from "@toneorg/design";
import { Analytics } from "@vercel/analytics/next";
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
    default: "tone: me diz o que você procura, eu pesquiso",
    template: "%s | tone",
  },
  description:
    "A tone é uma assistente de compras no Chrome: lembra do que você gosta, pesquisa na Amazon e no Mercado Livre por você e mostra poucas opções boas, com o porquê. Nunca paga nada. Em teste fechado: peça um convite.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "tone",
  },
};

export const viewport: Viewport = {
  themeColor: color.coral[500],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${crimsonPro.variable} ${hostGrotesk.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-wine focus:px-4 focus:py-2 focus:text-white"
        >
          Pular para o conteúdo
        </a>
        {children}
        {/* Page views only, without cookies. Collects nothing until enabled in the Vercel project. */}
        <Analytics />
      </body>
    </html>
  );
}
