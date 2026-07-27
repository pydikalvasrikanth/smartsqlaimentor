import { lazy, Suspense } from "react";
import type { SceneKey } from "@/content/pyspark-lessons";
import { ThreeScene } from "./scenes/ThreeScene";

const scenes = {
  sparkArch: lazy(() => import("./scenes/JvmScene")),
  driverExecutor: lazy(() => import("./scenes/StackHeapScene")),
  dagStages: lazy(() => import("./scenes/InheritanceScene")),
  partitions: lazy(() => import("./scenes/ArraysScene")),
  shuffle: lazy(() => import("./scenes/HashmapScene")),
  cache: lazy(() => import("./scenes/GcScene")),
  parallelTasks: lazy(() => import("./scenes/ThreadsScene")),
  cluster: lazy(() => import("./scenes/VirtualThreadsScene")),
  pipeline: lazy(() => import("./scenes/StreamsScene")),
} as const;

const labels: Record<SceneKey, string> = {
  sparkArch: "3D · Spark Architecture",
  driverExecutor: "3D · Driver vs Executors",
  dagStages: "3D · Jobs → Stages → Tasks",
  partitions: "3D · DataFrame Partitions",
  shuffle: "3D · Shuffle by Key",
  cache: "3D · Cache & Persist",
  parallelTasks: "3D · Parallel Tasks",
  cluster: "3D · Cluster at Scale",
  pipeline: "3D · Lazy Transform Pipeline",
};

const noAutoRotate: Partial<Record<SceneKey, boolean>> = {
  driverExecutor: true,
};

export function SceneFor({ sceneKey }: { sceneKey: SceneKey }) {
  const Comp = scenes[sceneKey];
  const autoRotate = !noAutoRotate[sceneKey];
  return (
    <div>
      <div className="mono mb-2 text-xs uppercase tracking-widest text-[color:var(--java-orange)]">
        {labels[sceneKey]}
      </div>
      <ThreeScene autoRotate={autoRotate} camera={sceneKey === "driverExecutor" ? [0, 2, 14] : [6, 5, 8]}>
        <Suspense fallback={null}>
          <Comp />
        </Suspense>
      </ThreeScene>
    </div>
  );
}