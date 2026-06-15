interface Props {
  active: boolean;
  onToggle: () => void;
}

export function PythonToggle({ active, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest border transition-colors ${
        active
          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
      title={active ? "Switch back to MySQL" : "Try the same problem in Python (pandas)"}
    >
      {active ? "← Back to SQL" : "Solve in Python"}
    </button>
  );
}