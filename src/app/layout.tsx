import type { Metadata, Viewport } from "next";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/500-italic.css";
import "@fontsource-variable/dm-sans";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Polish & Glow — Nail Salon em Lisboa", template: "%s · Polish & Glow" },
  description: "Manicure, pedicure, gel, nail art e pestanas num salão calmo e acolhedor em Lisboa. Faça a sua marcação online em menos de um minuto.",
  openGraph: { type: "website", locale: "pt_PT", siteName: "Polish & Glow" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#FFFFFF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
