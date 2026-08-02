import React from 'react';
import { Link } from 'react-router-dom';

export default function Card({ title, link, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-mist bg-surface p-5 ${className}`}>
      {(title || link) && (
        <header className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          {link && (
            <Link to={link.to} className="text-xs font-medium text-ink2 hover:text-ink whitespace-nowrap">{link.label} →</Link>
          )}
        </header>
      )}
      {children}
    </section>
  );
}