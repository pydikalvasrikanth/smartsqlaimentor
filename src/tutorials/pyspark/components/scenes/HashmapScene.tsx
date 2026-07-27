import { Text, RoundedBox, Line } from "@react-three/drei";

const buckets: { keys: { k: string; v: string }[] }[] = [
  { keys: [] },
  { keys: [{ k: "FR", v: "€12k" }] },
  { keys: [] },
  { keys: [{ k: "US", v: "$40k" }, { k: "US", v: "$18k" }] },
  { keys: [] },
  { keys: [{ k: "JP", v: "¥8m" }] },
  { keys: [] },
  { keys: [] },
];

export default function HashmapScene() {
  return (
    <group>
      <Text position={[0, 3, 0]} fontSize={0.3} color="#e25a1c" anchorX="center">
        Shuffle · rows land in a bucket by hashed key
      </Text>
      {buckets.map((b, i) => {
        const x = i * 1.3 - (buckets.length * 1.3) / 2 + 0.65;
        return (
          <group key={i} position={[x, 1, 0]}>
            <RoundedBox args={[1.1, 0.8, 0.7]} radius={0.08}>
              <meshStandardMaterial color="#1f2b42" metalness={0.4} roughness={0.5} />
            </RoundedBox>
            <Text position={[0, 0, 0.4]} fontSize={0.2} color="#94a3b8" anchorX="center">
              [{i}]
            </Text>
            {b.keys.map((entry, j) => (
              <group key={j} position={[0, -1.3 - j * 1.1, 0]}>
                <RoundedBox args={[1.3, 0.9, 0.6]} radius={0.08}>
                  <meshStandardMaterial
                    color="#34d9a5"
                    emissive="#34d9a5"
                    emissiveIntensity={0.25}
                  />
                </RoundedBox>
                <Text position={[0, 0.15, 0.35]} fontSize={0.16} color="#0a0e1a" anchorX="center">
                  {entry.k}
                </Text>
                <Text position={[0, -0.18, 0.35]} fontSize={0.14} color="#0a0e1a" anchorX="center">
                  → {entry.v}
                </Text>
                <Line
                  points={[
                    [0, 0.5, 0],
                    [0, 0.9, 0],
                  ]}
                  color="#f5c842"
                  lineWidth={2}
                />
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}