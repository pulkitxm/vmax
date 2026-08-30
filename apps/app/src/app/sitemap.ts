import type { MetadataRoute } from "next";

const origin = "https://vmax.pulkit.page";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    {
      url: `${origin}/how-it-works`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${origin}/dashboard`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/docs`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/faq`, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${origin}/presentation`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
