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
    default: "tone: antes de comprar, me manda o link",
    template: "%s | tone",
  },
  description:
    "A tone diz se a loja é confiável, quanto o produto custa em outras lojas e, se for base de maquiagem, se serve na sua pele. Ainda em construção: entre na lista de espera.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "tone",
  },
};

export const viewport: Viewport = {
  themeColor: "#e26b5c", // keep in sync with --color-coral in globals.css
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
      </body>
    </html>
  );
}
