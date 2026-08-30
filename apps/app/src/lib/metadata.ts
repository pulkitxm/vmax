import type { Metadata } from "next";

export function createPageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Vmax`,
      description,
      url: path,
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
      title: `${title} | Vmax`,
      description,
      images: ["/og-image.png"],
    },
  };
}
