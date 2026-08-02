import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-surface/85 backdrop-blur-md border-b border-mist/60' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-ink2 hover:text-ink transition-colors">{l.label}</a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-ink hover:text-ink2 transition-colors">Sign in</Link>
          <Link to="/register" className="text-sm font-medium bg-jet text-surface px-4 py-2 rounded-lg hover:bg-ink transition-colors">Get started</Link>
        </div>
        <button className="md:hidden p-2 -mr-2 text-ink" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-surface border-t border-mist/60 px-5 py-4 space-y-3">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="block text-sm text-ink2 py-1" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <Link to="/register" className="block text-center text-sm font-medium bg-jet text-surface px-4 py-2.5 rounded-lg">Get started</Link>
        </div>
      )}
    </header>
  );
}