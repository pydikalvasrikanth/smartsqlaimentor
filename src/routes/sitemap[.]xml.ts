import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://smartsqlaimentor.live";

interface Entry {
  path: string;
  changefreq?: "weekly" | "monthly" | "daily" | "yearly";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/practice", changefreq: "weekly", priority: "0.9" },
          { path: "/python", changefreq: "weekly", priority: "0.9" },
          { path: "/java", changefreq: "weekly", priority: "0.8" },
          { path: "/pyspark", changefreq: "weekly", priority: "0.8" },
          { path: "/cpp", changefreq: "weekly", priority: "0.85" },
          { path: "/gcp", changefreq: "weekly", priority: "0.9" },
          { path: "/interview", changefreq: "weekly", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
          { path: "/faq", changefreq: "monthly", priority: "0.7" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/engine", changefreq: "monthly", priority: "0.6" },
          { path: "/tutorial", changefreq: "monthly", priority: "0.7" },
          { path: "/java-tutorial", changefreq: "monthly", priority: "0.7" },
          { path: "/python-tutorial", changefreq: "monthly", priority: "0.7" },
          { path: "/cpp-tutorial", changefreq: "monthly", priority: "0.7" },
          { path: "/pyspark-tutorial", changefreq: "monthly", priority: "0.7" },
          { path: "/chat", changefreq: "monthly", priority: "0.5" },
          { path: "/feedback", changefreq: "monthly", priority: "0.3" },
          { path: "/auth", changefreq: "monthly", priority: "0.3" },
          { path: "/sql-interview-questions", changefreq: "weekly", priority: "0.85" },
          { path: "/python-coding-practice", changefreq: "weekly", priority: "0.85" },
          { path: "/pyspark-practice", changefreq: "weekly", priority: "0.8" },
          { path: "/gcp-data-engineer-interview", changefreq: "weekly", priority: "0.85" },
          { path: "/c-cpp-coding-practice", changefreq: "weekly", priority: "0.8" },
        ];

        const urls = entries
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});