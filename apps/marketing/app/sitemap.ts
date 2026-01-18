import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://clarisend.co";
  const locales = ["en", "fr"];
  const routes = ["", "/how-it-works", "/security", "/pricing", "/contact"];
  const lastModified = new Date();

  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified,
      changeFrequency: "weekly",
      priority: route === "" ? 1 : 0.8,
    }))
  );
}
