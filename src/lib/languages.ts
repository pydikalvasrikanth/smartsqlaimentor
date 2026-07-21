export type CodeLang = "python" | "java" | "c" | "cpp";

export const LANG_META: Record<
  CodeLang,
  { label: string; fileName: string; prismLang: string; hint: string }
> = {
  python: {
    label: "Python",
    fileName: "solution.py",
    prismLang: "python",
    hint: "Python 3 · pandas / stdlib welcome",
  },
  java: {
    label: "Java",
    fileName: "Solution.java",
    prismLang: "java",
    hint: "Java 17 · Solution class + main",
  },
  c: {
    label: "C",
    fileName: "solution.c",
    prismLang: "c",
    hint: "C11 · <stdio.h> + main()",
  },
  cpp: {
    label: "C++",
    fileName: "solution.cpp",
    prismLang: "cpp",
    hint: "C++17 · STL welcome",
  },
};

export const LANG_OPTIONS: CodeLang[] = ["python", "java", "c", "cpp"];

export function languageLabel(lang: CodeLang) {
  return LANG_META[lang].label;
}

/**
 * Build a per-language system prompt suffix used by the AI engine so questions,
 * grading, hints, solutions and theory are all delivered in the selected
 * language. The base engine already targets Python; the returned string
 * overrides that when the user picks another language.
 */
export function languageSpec(lang: CodeLang): string {
  switch (lang) {
    case "python":
      return `Target language: Python 3.11. Use idiomatic Python (list/dict comprehensions, f-strings, pathlib, typing). function_signature must be a valid \`def name(...) -> ...:\` line. starter_code must be a Python function skeleton with \`pass\`. expected_solution and any generated code must be valid Python 3.`;
    case "java":
      return `Target language: Java 17. Generate the problem as a Java coding question. function_signature must be a valid Java method signature such as \`public static int[] twoSum(int[] nums, int target)\`. starter_code must be a full compilable \`class Solution { ... public static void main(String[] args) { ... } }\` skeleton with a TODO body. expected_solution and any code you emit must be valid Java 17 (use Collections framework, streams where helpful). Represent test-case inputs/outputs as Java literals (e.g. \`new int[]{2,7,11,15}\`, \`5\`, \`"abc"\`).`;
    case "c":
      return `Target language: C11. function_signature must be a valid C function prototype such as \`int* twoSum(int* nums, int numsSize, int target, int* returnSize)\`. starter_code must include \`#include <stdio.h>\` (and stdlib.h / string.h where relevant) and a \`main()\` that calls the solution function. All code must be valid C11 — no C++ features. Test-case inputs/outputs are C literals or short array descriptions.`;
    case "cpp":
      return `Target language: C++17. function_signature must be a valid C++ method signature (either free function or inside a \`class Solution\`). starter_code must include the required \`#include\` headers, a \`class Solution\` (or free function) skeleton, and a small \`int main()\` that exercises it. Use STL containers (vector, unordered_map, etc.) idiomatically. All code must be valid C++17.`;
  }
}