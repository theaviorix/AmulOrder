import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-jet text-surface">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-surface text-jet grid place-items-center font-display font-bold text-lg">A</span>
              <span className="font-display font-semibold text-lg">Amul Connect</span>
            </span>
            <p className="mt-3 text-sm text-surface/60 max-w-xs">The structured ordering pipeline between dairy & FMCG distributors and their retailers.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-surface/70">
            <a href="#how" className="hover:text-surface">How it works</a>
            <a href="#features" className="hover:text-surface">Features</a>
            <a href="#pricing" className="hover:text-surface">Pricing</a>
            <Link to="/onboarding" className="hover:text-surface">Get started</Link>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-surface/15 flex flex-col sm:flex-row justify-between gap-2 text-xs text-surface/50">
          <p>© {new Date().getFullYear()} Amul Connect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}