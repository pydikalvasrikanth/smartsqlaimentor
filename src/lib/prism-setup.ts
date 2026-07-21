import Prism from "prismjs";

// Prism language components (prism-java, prism-c, etc.) reference a global
// `Prism` object. In an ESM build that global does not exist unless we set it
// ourselves before those component modules are evaluated.
(globalThis as any).Prism = Prism;

export { Prism };