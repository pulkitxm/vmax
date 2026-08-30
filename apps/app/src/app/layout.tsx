import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vmax.pulkit.page"),
  applicationName: "Vmax",
  title: {
    default: "Vmax | Every Joule Changes the Race",
    template: "%s | Vmax",
  },
  description:
    "Vmax develops the JouleIQ approach to price the future value of energy and make explainable race-strategy decisions.",
  alternates: { canonical: "/" },
  keywords: [
    "Vmax",
    "JouleIQ",
    "race strategy",
    "energy management",
    "F1 25 telemetry",
    "counterfactual planning",
  ],
  openGraph: {
    title: "Vmax | Energy-Aware Race Strategy",
    description:
      "The JouleIQ approach helps Vmax decide when energy is worth more now and when it is worth saving for later.",
    url: "/",
    siteName: "Vmax",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vmax energy-aware race strategy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vmax | Energy-Aware Race Strategy",
    description:
      "The JouleIQ approach helps Vmax decide when energy is worth more now and when it is worth saving for later.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
