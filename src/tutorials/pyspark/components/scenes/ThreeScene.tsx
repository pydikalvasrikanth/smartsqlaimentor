import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, type ReactNode } from "react";

export function ThreeScene({
  children,
  camera = [6, 5, 8],
  height = 420,
  autoRotate = true,
}: {
  children: ReactNode;
  camera?: [number, number, number];
  height?: number;
  autoRotate?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-[color:var(--surface2)] glow-orange"
      style={{ height }}
    >
      <Canvas camera={{ position: camera, fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={["#141a2a"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <directionalLight position={[-8, -4, -6]} intensity={0.4} color="#5382a1" />
        <Suspense fallback={null}>{children}</Suspense>
        <OrbitControls
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          minDistance={4}
          maxDistance={20}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 right-3 mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Drag · scroll · click
      </div>
    </div>
  );
}