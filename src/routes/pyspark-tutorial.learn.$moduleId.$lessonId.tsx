import { createFileRoute, notFound } from "@tanstack/react-router";
import { findLesson } from "@/tutorials/pyspark/content/pyspark-lessons";
import { LessonView } from "@/tutorials/pyspark/components/LessonView";

export const Route = createFileRoute("/pyspark-tutorial/learn/$moduleId/$lessonId")({
  loader: ({ params }) => {
    const found = findLesson(params.moduleId, params.lessonId);
    if (!found) throw notFound();
    return found;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Lesson not found — PySpark Visual Explainer" },
          { name: "description", content: "This PySpark tutorial lesson could not be found." },
        ],
      };
    }
    const t = `${loaderData.lesson.title} — PySpark Visual Explainer`;
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
  component: LessonPage,
});

function LessonPage() {
  const { module, lesson } = Route.useLoaderData();
  return <LessonView module={module} lesson={lesson} />;
}
