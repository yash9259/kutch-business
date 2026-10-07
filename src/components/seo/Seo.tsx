import { useEffect } from "react";
import { SITE, absoluteUrl } from "@/lib/siteConfig";

interface SeoProps {
  title: string;
  description: string;
  /** Path such as "/jobs" (canonical URL is built from SITE.url). */
  path?: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const JSONLD_ATTR = "data-seo-jsonld";

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/**
 * Lightweight head manager (no extra dependency). Updates title, description,
 * canonical, robots, Open Graph, Twitter and JSON-LD on every route change.
 * Non-JS crawlers get the same tags from the build-time prerender
 * (scripts/generate-seo.mjs).
 */
const Seo = ({ title, description, path, image, noindex, type = "website", jsonLd }: SeoProps) => {
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const fullTitle = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;
    const canonical = absoluteUrl(path ?? window.location.pathname);
    const img = image || SITE.logo;

    document.title = fullTitle;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    });
    upsertLink("canonical", canonical);

    upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: img });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE.name });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: SITE.locale });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: img });

    // Replace page-level JSON-LD (the site-wide Organization/WebSite block in index.html is left alone).
    document.head.querySelectorAll(`script[${JSONLD_ATTR}]`).forEach((n) => n.remove());
    if (jsonKey) {
      const items = Array.isArray(JSON.parse(jsonKey)) ? JSON.parse(jsonKey) : [JSON.parse(jsonKey)];
      items.forEach((item: unknown) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute(JSONLD_ATTR, "true");
        script.text = JSON.stringify(item);
        document.head.appendChild(script);
      });
    }

    return () => {
      document.head.querySelectorAll(`script[${JSONLD_ATTR}]`).forEach((n) => n.remove());
    };
  }, [title, description, path, image, noindex, type, jsonKey]);

  return null;
};

export default Seo;
