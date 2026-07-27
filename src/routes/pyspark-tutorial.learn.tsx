import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LessonSidebar } from "@/tutorials/pyspark/components/LessonSidebar";

export const Route = createFileRoute("/pyspark-tutorial/learn")({
  component: LearnLayout,
});

function LearnLayout() {
  return (
    <div className="tut-dark flex min-h-screen bg-background text-foreground">
      <LessonSidebar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
