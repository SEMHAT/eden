import type { Metadata, Viewport } from "next";
import "@fontsource-variable/sora";
import "@fontsource-variable/inter";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareBar } from "@/components/CompareBar";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "EDEN — La tech qui vous ressemble", template: "%s · EDEN" },
  description: "Dites-nous votre budget, Eden trouve le bon produit : smartphones, ordinateurs, audio, gaming et cadeaux tech au Togo.",
  openGraph: { title: "EDEN — La tech qui vous ressemble", description: "Dis-nous ton budget. On s'occupe du reste.", locale: "fr_TG", type: "website" },
};

export const viewport: Viewport = { themeColor: "#063B25", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-eden-gold focus:px-4 focus:py-2 focus:text-eden-green">
          Aller au contenu
        </a>
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
        <CompareBar />
      </body>
    </html>
  );
}
