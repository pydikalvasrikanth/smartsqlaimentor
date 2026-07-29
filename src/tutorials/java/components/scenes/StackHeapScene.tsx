import { Text, RoundedBox, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

const stackFrames = [
  { name: "main()", vars: "int n = 3" },
  { name: "factorial(3)", vars: "n=3 → ref" },
  { name: "factorial(2)", vars: "n=2 → ref" },
  { name: "factorial(1)", vars: "n=1 → 1" },
];

const heapObjects = [
  { label: "Point{x:3, y:4}", pos: [5, 1.5, 0] as [number, number, number] },
  { label: "String \"Ada\"", pos: [6, -0.5, 1] as [number, number, number] },
  { label: "int[5]", pos: [4.5, -1.8, -0.5] as [number, number, number] },
];

export default function StackHeapScene() {
  const heap = useRef<Mesh>(null);
  useFrame((state) => {
    if (heap.current) heap.current.rotation.y = state.clock.elapsedTime * 0.2;
  });
  return (
    <group>
      {/* Stack label */}
      <Text position={[-4, 3, 0]} fontSize={0.35} color="#f89820">
        STACK
      </Text>
      {stackFrames.map((f, i) => (
        <group key={i} position={[-4, 2 - i * 1.05, 0]}>
          <RoundedBox args={[3, 0.9, 0.6]} radius={0.08}>
            <meshStandardMaterial color="#1f2b42" />
          </RoundedBox>
          <Text position={[0, 0.15, 0.35]} fontSize={0.18} color="#f5c842" anchorX="center">
            {f.name}
          </Text>
          <Text position={[0, -0.18, 0.35]} fontSize={0.14} color="#94a3b8" anchorX="center">
            {f.vars}
          </Text>
        </group>
      ))}

      {/* Heap label */}
      <Text position={[5, 3, 0]} fontSize={0.35} color="#5382a1">
        HEAP
      </Text>
      <mesh ref={heap} position={[5, 0, 0]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial color="#5382a1" transparent opacity={0.08} wireframe />
      </mesh>
      {heapObjects.map((o, i) => (
        <group key={i} position={o.pos}>
          <RoundedBox args={[1.6, 0.6, 0.6]} radius={0.1}>
            <meshStandardMaterial color="#34d9a5" emissive="#34d9a5" emissiveIntensity={0.2} />
          </RoundedBox>
          <Text position={[0, 0, 0.4]} fontSize={0.14} color="#0a0e1a" anchorX="center">
            {o.label}
          </Text>
        </group>
      ))}

      {/* Reference arrows */}
      {heapObjects.map((o, i) => (
        <Line
          key={i}
          points={[[-2.4, 1.5 - i * 0.9, 0], o.pos]}
          color="#f5c842"
          lineWidth={1.5}
          dashed
          dashSize={0.2}
          gapSize={0.15}
        />
      ))}
    </group>
  );
}