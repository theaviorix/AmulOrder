import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export default function SortSelect({ value, onChange, options }) {
  return (
    <div className="relative inline-flex items-center">
      <ArrowUpDown size={13} className="absolute left-3 text-ink2 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-mist bg-surface pl-8 pr-8 py-2.5 text-sm text-ink outline-none focus:border-ink transition-colors cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
