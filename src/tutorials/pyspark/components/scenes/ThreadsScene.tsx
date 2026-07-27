import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function Thread({ y, color, speed, label }: { y: number; color: string; speed: number; label: string }) {
  const m = useRef<Mesh>(null);
  useFrame((state) => {
    if (m.current) {
      m.current.position.x = ((state.clock.elapsedTime * speed) % 10) - 5;
    }
  });
  return (
    <group position={[0, y, 0]}>
      <RoundedBox args={[10, 0.15, 0.6]} radius={0.05} position={[0, -0.4, 0]}>
        <meshStandardMaterial color="#1f2b42" />
      </RoundedBox>
      <Text position={[-5.5, 0, 0]} fontSize={0.22} color={color} anchorX="right">
        {label}
      </Text>
      <mesh ref={m}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

export default function ThreadsScene() {
  return (
    <group>
      <Text position={[0, 3, 0]} fontSize={0.3} color="#e25a1c" anchorX="center">
        Tasks running in parallel on cached partitions
      </Text>
      <Thread y={1.5} color="#e25a1c" speed={1.5} label="Task · P0" />
      <Thread y={0} color="#34d9a5" speed={2.1} label="Task · P1" />
      <Thread y={-1.5} color="#a78bfa" speed={1.2} label="Task · P2" />

      {/* Shared heap object */}
      <group position={[6, 0, 0]}>
        <RoundedBox args={[1.6, 1.6, 1.6]} radius={0.15}>
          <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.3} />
        </RoundedBox>
        <Text position={[0, 0.15, 0.85]} fontSize={0.2} color="#0a0e1a" anchorX="center">
          Broadcast
        </Text>
        <Text position={[0, -0.2, 0.85]} fontSize={0.16} color="#0a0e1a" anchorX="center">
          on every exec
        </Text>
      </group>
    </group>
  );
}