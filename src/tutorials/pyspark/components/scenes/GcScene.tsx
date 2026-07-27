import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

type Obj = { pos: [number, number, number]; age: number; alive: boolean };

export default function GcScene() {
  const g = useRef<Group>(null);
  const objs = useMemo<Obj[]>(() => {
    const arr: Obj[] = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        pos: [
          (Math.random() - 0.5) * 4 - 2.5,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 2,
        ],
        age: Math.random(),
        alive: Math.random() > 0.3,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (g.current) g.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  return (
    <group ref={g}>
      <Text position={[-2.5, 2.5, 0]} fontSize={0.3} color="#34d9a5" anchorX="center">
        In memory
      </Text>
      <RoundedBox args={[5, 4, 3]} radius={0.15} position={[-2.5, 0, 0]}>
        <meshStandardMaterial color="#34d9a5" transparent opacity={0.05} wireframe />
      </RoundedBox>

      <Text position={[3, 2.5, 0]} fontSize={0.3} color="#e25a1c" anchorX="center">
        Spilled to disk
      </Text>
      <RoundedBox args={[4, 4, 3]} radius={0.15} position={[3, 0, 0]}>
        <meshStandardMaterial color="#f89820" transparent opacity={0.05} wireframe />
      </RoundedBox>

      {objs.map((o, i) => (
        <mesh key={i} position={o.pos}>
          <sphereGeometry args={[0.15 + o.age * 0.15, 12, 12]} />
          <meshStandardMaterial
            color={o.alive ? (o.age > 0.6 ? "#f89820" : "#34d9a5") : "#475569"}
            emissive={o.alive ? (o.age > 0.6 ? "#f89820" : "#34d9a5") : "#000"}
            emissiveIntensity={o.alive ? 0.4 : 0}
            transparent
            opacity={o.alive ? 1 : 0.3}
          />
        </mesh>
      ))}

      {/* Old gen (promoted) objects */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={"old" + i}
          position={[
            3 + (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 2,
          ]}
        >
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#f89820" emissive="#f89820" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}