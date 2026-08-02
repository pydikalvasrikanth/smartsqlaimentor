import { createFileRoute } from "@tanstack/react-router";
import { cppCurriculum } from "@/tutorials/ccpp/content/cpp-lessons";
import { TrackIndex } from "@/tutorials/ccpp/components/TrackIndex";

export const Route = createFileRoute("/cpp-tutorial/cpp/")({
  head: () => ({
    meta: [
      { title: "Learn C++ — Visual Explainer" },
      { name: "description", content: "7-module modern C++ course: RAII, templates, STL, concurrency, C++20." },
      { property: "og:title", content: "Learn C++ — Visual Explainer" },
      { property: "og:description", content: "Infographic-style modern C++ lessons from Hello World to job-ready." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartsqlaimentor.live/cpp-tutorial/cpp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/cpp-tutorial/cpp" }],
  }),
  component: () => (
    <div className="tut-dark min-h-screen">
      <TrackIndex curriculum={cppCurriculum} />
    </div>
  ),
});
