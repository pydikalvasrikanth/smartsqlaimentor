import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

const stages = [
  { name: "ClassLoader", color: "#f89820", x: -4.5 },
  { name: "Runtime Data Areas", color: "#5382a1", x: 0 },
  { name: "Execution Engine", color: "#a78bfa", x: 4.5 },
];

export default function JvmScene() {
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.15;
  });
  return (
    <group ref={g}>
      {stages.map((s, i) => (
        <group key={s.name} position={[s.x, 0, 0]}>
          <RoundedBox args={[3, 2.2, 1.4]} radius={0.15}>
            <meshStandardMaterial color={s.color} metalness={0.4} roughness={0.35} />
          </RoundedBox>
          <Text position={[0, 0, 0.75]} fontSize={0.3} color="#0a0e1a" anchorX="center">
            {s.name}
          </Text>
          <Text position={[0, -1.5, 0]} fontSize={0.22} color="#e2e8f8">
            {i === 0 ? "Load .class" : i === 1 ? "Heap · Stack · Metaspace" : "Interpreter + JIT"}
          </Text>
        </group>
      ))}
      {[0, 1].map((i) => (
        <mesh key={i} position={[-2.25 + i * 4.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.2, 0.5, 8]} />
          <meshStandardMaterial color="#f5c842" />
        </mesh>
      ))}
    </group>
  );
}