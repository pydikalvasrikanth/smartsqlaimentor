import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import type { Group } from "three";

type Particle = { start: number; value: number; keep: boolean };

export default function StreamsScene() {
  const g = useRef<Group>(null);
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        start: i * 0.4,
        value: i + 1,
        keep: (i + 1) % 2 === 0,
      })),
    [],
  );

  useFrame(() => {
    if (!g.current) return;
    const t = performance.now() / 1000;
    g.current.children.forEach((child, idx) => {
      const p = particles[idx];
      if (!p) return;
      const localT = ((t - p.start) % 8) / 8;
      child.position.x = -6 + localT * 12;
      const stage = localT < 0.33 ? 0 : localT < 0.66 ? 1 : 2;
      child.visible = !(stage >= 1 && !p.keep);
      const scaleT = stage === 2 ? 1.4 : 1;
      child.scale.setScalar(scaleT);
    });
  });

  return (
    <group>
      {/* Stages */}
      {[
        { x: -4, label: "filter", color: "#f89820" },
        { x: 0, label: "map", color: "#5382a1" },
        { x: 4, label: "reduce", color: "#a78bfa" },
      ].map((s) => (
        <group key={s.label} position={[s.x, 1.6, 0]}>
          <RoundedBox args={[2, 0.8, 0.4]} radius={0.1}>
            <meshStandardMaterial color={s.color} />
          </RoundedBox>
          <Text position={[0, 0, 0.25]} fontSize={0.28} color="#0a0e1a" anchorX="center">
            {s.label}
          </Text>
        </group>
      ))}
      {/* Conveyor */}
      <RoundedBox args={[13, 0.1, 1]} radius={0.05} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1f2b42" />
      </RoundedBox>
      <group ref={g}>
        {particles.map((p, i) => (
          <mesh key={i} position={[-6, 0.4, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshStandardMaterial
              color={p.keep ? "#34d9a5" : "#475569"}
              emissive={p.keep ? "#34d9a5" : "#000"}
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}