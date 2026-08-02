import { createFileRoute } from "@tanstack/react-router";
import { cCurriculum } from "@/tutorials/ccpp/content/c-lessons";
import { TrackIndex } from "@/tutorials/ccpp/components/TrackIndex";

export const Route = createFileRoute("/cpp-tutorial/c/")({
  head: () => ({
    meta: [
      { title: "Learn C — Visual Explainer" },
      { name: "description", content: "6-module C course: pointers, memory, threads, sockets, secure C." },
      { property: "og:title", content: "Learn C — Visual Explainer" },
      { property: "og:description", content: "Infographic-style C lessons from Hello World to job-ready." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartsqlaimentor.live/cpp-tutorial/c" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/cpp-tutorial/c" }],
  }),
  component: () => (
    <div className="tut-dark min-h-screen">
      <TrackIndex curriculum={cCurriculum} />
    </div>
  ),
});
