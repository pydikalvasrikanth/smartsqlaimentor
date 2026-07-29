import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { InstancedMesh, Object3D } from "three";
import { useEffect } from "react";
import * as THREE from "three";

export default function VirtualThreadsScene() {
  const mesh = useRef<InstancedMesh>(null);
  const count = 800;

  const dummy = useMemo<Object3D>(() => new THREE.Object3D(), []);
  const positions = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        r: 2 + Math.random() * 2.2,
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        speed: 0.2 + Math.random() * 0.6,
      })),
    [count],
  );

  useEffect(() => {
    if (!mesh.current) return;
    mesh.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    positions.forEach((p, i) => {
      const theta = p.theta + t * p.speed * 0.3;
      const x = p.r * Math.sin(p.phi) * Math.cos(theta);
      const y = p.r * Math.cos(p.phi);
      const z = p.r * Math.sin(p.phi) * Math.sin(theta);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.08 + Math.sin(t * 2 + i) * 0.02);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <Text position={[0, 3.5, 0]} fontSize={0.28} color="#f89820" anchorX="center">
        {count} virtual threads → 4 carriers
      </Text>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#34d9a5" emissive="#34d9a5" emissiveIntensity={0.4} />
      </instancedMesh>
      {/* Carrier threads */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8]}>
            <RoundedBox args={[0.6, 0.6, 0.6]} radius={0.08}>
              <meshStandardMaterial color="#f89820" emissive="#f89820" emissiveIntensity={0.5} />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}