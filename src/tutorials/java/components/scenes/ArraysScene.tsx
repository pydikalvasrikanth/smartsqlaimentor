import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

const values = [2, 3, 5, 7, 11, 13, 17];

export default function ArraysScene() {
  const g = useRef<Group>(null);
  useFrame((state) => {
    if (g.current) g.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
  });
  return (
    <group ref={g}>
      {values.map((v, i) => (
        <group key={i} position={[i * 1.3 - (values.length * 1.3) / 2 + 0.65, 0, 0]}>
          <RoundedBox args={[1.1, 1.1, 1.1]} radius={0.08}>
            <meshStandardMaterial
              color="#5382a1"
              metalness={0.5}
              roughness={0.3}
              emissive="#5382a1"
              emissiveIntensity={0.15}
            />
          </RoundedBox>
          <Text position={[0, 0, 0.6]} fontSize={0.35} color="#f5c842" anchorX="center">
            {v}
          </Text>
          <Text position={[0, -0.9, 0]} fontSize={0.2} color="#94a3b8" anchorX="center">
            [{i}]
          </Text>
        </group>
      ))}
      <Text position={[0, 1.5, 0]} fontSize={0.28} color="#f89820" anchorX="center">
        int[] primes = new int[{values.length}]
      </Text>
    </group>
  );
}