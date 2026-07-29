import { lazy, Suspense } from "react";
import type { SceneKey } from "@/tutorials/java/content/java-lessons";
import { ThreeScene } from "@/tutorials/java/components/scenes/ThreeScene";

const scenes = {
  jvm: lazy(() => import("./scenes/JvmScene")),
  stackHeap: lazy(() => import("./scenes/StackHeapScene")),
  inheritance: lazy(() => import("./scenes/InheritanceScene")),
  arrays: lazy(() => import("./scenes/ArraysScene")),
  hashmap: lazy(() => import("./scenes/HashmapScene")),
  gc: lazy(() => import("./scenes/GcScene")),
  threads: lazy(() => import("./scenes/ThreadsScene")),
  virtualThreads: lazy(() => import("./scenes/VirtualThreadsScene")),
  streams: lazy(() => import("./scenes/StreamsScene")),
} as const;

const labels: Record<SceneKey, string> = {
  jvm: "3D · JVM Architecture",
  stackHeap: "3D · Stack vs Heap",
  inheritance: "3D · Inheritance Tree",
  arrays: "3D · Array Layout",
  hashmap: "3D · HashMap Buckets",
  gc: "3D · Garbage Collection",
  threads: "3D · Concurrent Threads",
  virtualThreads: "3D · Virtual Threads",
  streams: "3D · Stream Pipeline",
};

export function SceneFor({ sceneKey }: { sceneKey: SceneKey }) {
  const Comp = scenes[sceneKey];
  return (
    <div>
      <div className="mono mb-2 text-xs uppercase tracking-widest text-[color:var(--java-orange)]">
        {labels[sceneKey]}
      </div>
      <ThreeScene>
        <Suspense fallback={null}>
          <Comp />
        </Suspense>
      </ThreeScene>
    </div>
  );
}