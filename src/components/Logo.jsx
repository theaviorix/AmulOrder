import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ compact = false, light = false, className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="w-9 h-9 rounded-lg bg-jet text-surface grid place-items-center font-display font-bold text-lg tracking-tight shadow-sm">
        A
      </span>
      {!compact && (
        <span className={`font-display font-semibold text-lg tracking-tight leading-none ${light ? 'text-surface' : 'text-ink'}`}>
          Amul&nbsp;<span className={`font-medium ${light ? 'text-surface/60' : 'text-ink2'}`}>Connect</span>
        </span>
      )}
    </Link>
  );
}