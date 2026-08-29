import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vmax.pulkit.page"),
  title: "Vmax | Energy-Aware Race Strategy",
  description:
    "Vmax develops the JouleIQ approach to price the future value of energy and make explainable race-strategy decisions.",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
