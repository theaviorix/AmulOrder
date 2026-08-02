import React from 'react';

export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <span className="w-14 h-14 rounded-2xl bg-mist/60 text-ink2 grid place-items-center mb-4">
          <Icon size={24} />
        </span>
      )}
      <p className="font-display font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink2 max-w-xs">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}