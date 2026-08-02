import React from 'react';

const SIZES = { xs: 'w-7 h-7 text-[10px]', sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-20 h-20 text-2xl' };

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export default function Avatar({ src, name, size = 'sm', className = '' }) {
  const sizing = SIZES[size] || SIZES.sm;
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizing} rounded-full object-cover object-center aspect-square shrink-0 grow-0 basis-auto ${className}`}
        style={{ minWidth: 0 }}
      />
    );
  }
  return (
    <span className={`${sizing} rounded-full bg-jet text-surface grid place-items-center font-display font-semibold shrink-0 grow-0 basis-auto aspect-square ${className}`}>
      {initials(name)}
    </span>
  );
}
