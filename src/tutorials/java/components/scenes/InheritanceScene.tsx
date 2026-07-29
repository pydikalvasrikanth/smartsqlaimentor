import { Text, RoundedBox, Line } from "@react-three/drei";
import { useState } from "react";

type Node = {
  id: string;
  name: string;
  pos: [number, number, number];
  color: string;
  parent?: string;
  members: string[];
};

const nodes: Node[] = [
  { id: "Animal", name: "Animal", pos: [0, 2.5, 0], color: "#f89820", members: ["name", "speak()"] },
  { id: "Dog", name: "Dog", pos: [-3, -0.5, 0], color: "#5382a1", parent: "Animal", members: ["fetch()", "speak() ↳"] },
  { id: "Cat", name: "Cat", pos: [0, -0.5, 0], color: "#5382a1", parent: "Animal", members: ["scratch()", "speak() ↳"] },
  { id: "Cow", name: "Cow", pos: [3, -0.5, 0], color: "#5382a1", parent: "Animal", members: ["milk()", "speak() ↳"] },
  { id: "Puppy", name: "Puppy", pos: [-3, -3, 0], color: "#a78bfa", parent: "Dog", members: ["play()"] },
];

export default function InheritanceScene() {
  const [selected, setSelected] = useState<string>("Puppy");

  const chainOf = (id: string): string[] => {
    const n = nodes.find((x) => x.id === id);
    if (!n) return [];
    return n.parent ? [id, ...chainOf(n.parent)] : [id];
  };
  const chain = new Set(chainOf(selected));

  return (
    <group>
      {nodes.map((n) => {
        const parent = n.parent ? nodes.find((x) => x.id === n.parent) : null;
        return parent ? (
          <Line
            key={n.id + "-line"}
            points={[n.pos, parent.pos]}
            color={chain.has(n.id) ? "#f5c842" : "#2a3f5f"}
            lineWidth={chain.has(n.id) ? 2 : 1}
          />
        ) : null;
      })}
      {nodes.map((n) => (
        <group key={n.id} position={n.pos} onClick={() => setSelected(n.id)}>
          <RoundedBox args={[2, 1.4, 0.6]} radius={0.1}>
            <meshStandardMaterial
              color={n.color}
              emissive={chain.has(n.id) ? "#f5c842" : "#000000"}
              emissiveIntensity={chain.has(n.id) ? 0.3 : 0}
              metalness={0.3}
              roughness={0.4}
            />
          </RoundedBox>
          <Text position={[0, 0.25, 0.35]} fontSize={0.24} color="#0a0e1a" anchorX="center">
            {n.name}
          </Text>
          <Text position={[0, -0.25, 0.35]} fontSize={0.11} color="#0a0e1a" anchorX="center">
            {n.members.join("  ·  ")}
          </Text>
        </group>
      ))}
      <Text position={[0, -4.2, 0]} fontSize={0.2} color="#94a3b8" anchorX="center">
        Click a class · gold chain shows its inheritance path
      </Text>
    </group>
  );
}