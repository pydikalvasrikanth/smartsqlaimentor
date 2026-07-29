import { createFileRoute, notFound } from "@tanstack/react-router";
import { findLesson } from "@/tutorials/java/content/java-lessons";
import { LessonView } from "@/tutorials/java/components/LessonView";

export const Route = createFileRoute("/java-tutorial/learn/$moduleId/$lessonId")({
  loader: ({ params }) => {
    const found = findLesson(params.moduleId, params.lessonId);
    if (!found) throw notFound();
    return found;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Lesson not found — Java Visual Explainer" },
          { name: "description", content: "This Java tutorial lesson could not be found." },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const t = `${loaderData.lesson.title} — Java Visual Explainer`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.lesson.tagline },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.lesson.tagline },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: LessonPage,
});

function LessonPage() {
  const { module, lesson } = Route.useLoaderData();
  return <LessonView module={module} lesson={lesson} />;
}