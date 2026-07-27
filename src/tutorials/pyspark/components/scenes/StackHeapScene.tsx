import { Text, RoundedBox, Line } from "@react-three/drei";

const driverSteps = [
  { name: "SparkSession", detail: "entry point" },
  { name: "Build plan", detail: "logical → physical" },
  { name: "Schedule DAG", detail: "stages + tasks" },
  { name: "Collect results", detail: "back to driver" },
];

const executors = [
  { label: "Executor 1", partitions: "P0 · P1 · P2 · P3", y: 2.2 },
  { label: "Executor 2", partitions: "P4 · P5 · P6 · P7", y: 0 },
  { label: "Executor 3", partitions: "P8 · P9 · P10 · P11", y: -2.2 },
];

export default function StackHeapScene() {
  return (
    <group>
      {/* DRIVER side */}
      <Text position={[-5, 3.7, 0]} fontSize={0.6} color="#ff8a3d" anchorX="center">
        DRIVER
      </Text>
      <Text position={[-5, 3.15, 0]} fontSize={0.24} color="#e2e8f8" anchorX="center">
        1 process · plans the work
      </Text>
      {driverSteps.map((f, i) => (
        <group key={i} position={[-5, 2 - i * 1.15, 0]}>
          <RoundedBox args={[3.8, 1.0, 0.5]} radius={0.12}>
            <meshStandardMaterial color="#0f1626" />
          </RoundedBox>
          <Text position={[0, 0.18, 0.3]} fontSize={0.3} color="#ffd85e" anchorX="center">
            {`${i + 1}. ${f.name}`}
          </Text>
          <Text position={[0, -0.25, 0.3]} fontSize={0.2} color="#e2e8f8" anchorX="center">
            {f.detail}
          </Text>
        </group>
      ))}

      {/* EXECUTORS side */}
      <Text position={[5, 3.7, 0]} fontSize={0.6} color="#7cb8e8" anchorX="center">
        EXECUTORS
      </Text>
      <Text position={[5, 3.15, 0]} fontSize={0.24} color="#e2e8f8" anchorX="center">
        many workers · run tasks on partitions
      </Text>
      {executors.map((e, i) => (
        <group key={i} position={[5, e.y, 0]}>
          <RoundedBox args={[4.2, 1.7, 0.6]} radius={0.14}>
            <meshStandardMaterial color="#123049" metalness={0.2} roughness={0.6} />
          </RoundedBox>
          <Text position={[0, 0.42, 0.35]} fontSize={0.34} color="#ffffff" anchorX="center">
            {e.label}
          </Text>
          <Text position={[0, -0.02, 0.35]} fontSize={0.22} color="#8fe4c6" anchorX="center">
            {e.partitions}
          </Text>
          <Text position={[0, -0.5, 0.35]} fontSize={0.17} color="#cbd5e1" anchorX="center">
            cores + memory + cache
          </Text>
          {/* arrow from driver to this executor */}
          <Line
            points={[[-2.2, 0, 0.3], [-6.6, -e.y, 0.3]]}
            color="#f5c842"
            lineWidth={2}
            dashed
            dashSize={0.25}
            gapSize={0.15}
          />
        </group>
      ))}

      <Text position={[0, -3.7, 0]} fontSize={0.24} color="#e2e8f8" anchorX="center">
        driver sends tasks  →   executors return results
      </Text>
    </group>
  );
}