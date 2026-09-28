import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "tone: o tom certo de base, pela sua selfie",
    template: "%s | tone",
  },
  description:
    "Chega de escolher base por uma bolinha de cor. A tone mostra qual tom de cada marca é o seu a partir de uma selfie, com cor calibrada para a pele brasileira.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "tone",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f3f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body className="min-h-dvh">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
