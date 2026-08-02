import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({ value, onChange, min = 0, step = 0.5, max }) {
  const set = (v) => {
    let n = Number(v);
    if (isNaN(n)) n = 0;
    if (max !== undefined) n = Math.min(n, max);
    n = Math.max(min, n);
    // round to nearest step
    n = Math.round(n * (1 / step)) / (1 / step);
    onChange(n);
  };
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card">
      <button onClick={() => set(value - step)} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground" type="button">
        <Minus size={15} />
      </button>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={(e) => set(e.target.value)}
        className="w-12 border-x border-border bg-transparent py-1.5 text-center font-mono-tight text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button onClick={() => set(value + step)} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground" type="button">
        <Plus size={15} />
      </button>
    </div>
  );
}