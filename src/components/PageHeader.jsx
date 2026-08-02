import React from 'react';

export default function PageHeader({ title, sub, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h1 className="font-display font-bold text-ink text-2xl tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink2">{sub}</p>}
      </div>
      {action}
    </div>
  );
}