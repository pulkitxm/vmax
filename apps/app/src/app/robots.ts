import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://vmax.pulkit.page/sitemap.xml",
    host: "https://vmax.pulkit.page",
  };
}
