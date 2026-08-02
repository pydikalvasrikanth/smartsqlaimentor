import { createFileRoute, notFound } from "@tanstack/react-router";
import { cppCurriculum } from "@/tutorials/ccpp/content/cpp-lessons";
import { findLesson } from "@/tutorials/ccpp/content/types";
import { LessonView } from "@/tutorials/ccpp/components/LessonView";
import { LessonSidebar } from "@/tutorials/ccpp/components/LessonSidebar";
import { MobileNav } from "@/tutorials/ccpp/components/MobileNav";

export const Route = createFileRoute("/cpp-tutorial/cpp/$moduleId/$lessonId")({
  loader: ({ params }) => {
    const f = findLesson(cppCurriculum, params.moduleId, params.lessonId);
    if (!f) throw notFound();
    return f;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Lesson not found — C++ Explainer" }] };
    const t = `${loaderData.lesson.title} — C++ Explainer`;
    const url = `https://smartsqlaimentor.live/cpp-tutorial/cpp/${loaderData.module.id}/${loaderData.lesson.id}`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.lesson.tagline },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.lesson.tagline },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: loaderData.lesson.title,
            description: loaderData.lesson.tagline,
            teaches: loaderData.lesson.title,
            url,
            inLanguage: "en",
            learningResourceType: "Tutorial",
            about: { "@type": "Thing", name: "C++ programming" },
          }),
        },
      ],
    };
  },
  component: Page,
});

function Page() {
  const { module, lesson } = Route.useLoaderData();
  return (
    <div className="tut-dark min-h-screen bg-background text-foreground">
      <MobileNav curriculum={cppCurriculum} />
      <div className="flex">
        <div className="hidden md:block sticky top-0 h-screen">
          <LessonSidebar curriculum={cppCurriculum} />
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <LessonView curriculum={cppCurriculum} module={module} lesson={lesson} />
        </main>
      </div>
    </div>
  );
}
