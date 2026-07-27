import { createFileRoute, notFound } from "@tanstack/react-router";
import { cCurriculum } from "@/tutorials/ccpp/content/c-lessons";
import { findLesson } from "@/tutorials/ccpp/content/types";
import { LessonView } from "@/tutorials/ccpp/components/LessonView";
import { LessonSidebar } from "@/tutorials/ccpp/components/LessonSidebar";
import { MobileNav } from "@/tutorials/ccpp/components/MobileNav";

export const Route = createFileRoute("/cpp-tutorial/c/$moduleId/$lessonId")({
  loader: ({ params }) => {
    const f = findLesson(cCurriculum, params.moduleId, params.lessonId);
    if (!f) throw notFound();
    return f;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Lesson not found — C Explainer" }] };
    const t = `${loaderData.lesson.title} — C Explainer`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.lesson.tagline },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.lesson.tagline },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Page,
});

function Page() {
  const { module, lesson } = Route.useLoaderData();
  return (
    <div className="tut-dark min-h-screen bg-background text-foreground">
      <MobileNav curriculum={cCurriculum} />
      <div className="flex">
        <div className="hidden md:block sticky top-0 h-screen">
          <LessonSidebar curriculum={cCurriculum} />
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <LessonView curriculum={cCurriculum} module={module} lesson={lesson} />
        </main>
      </div>
    </div>
  );
}
