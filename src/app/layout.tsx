import type { Metadata, Viewport } from "next";
import "@fontsource/marcellus/400.css";
import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Luxe Nails by MVN — Nail designer em Agualva-Cacém", template: "%s · Luxe Nails" },
  description: "Unhas de gel, francesinha, nail art e pés com a Matilde, nail designer em Agualva-Cacém. Preços acessíveis e marcação online.",
  openGraph: { type: "website", locale: "pt_PT", siteName: "Luxe Nails by MVN" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#131010", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
