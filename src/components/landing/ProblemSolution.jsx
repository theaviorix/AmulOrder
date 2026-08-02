import React from 'react';
import { Phone, MessageSquare, X, ClipboardCheck, Wallet, Bell } from 'lucide-react';

const PAINS = [
  { icon: Phone, text: 'Missed calls & unclear voice orders' },
  { icon: MessageSquare, text: 'Quantities lost in WhatsApp threads' },
  { icon: X, text: 'No idea who ordered what by which round' },
];
const GAINS = [
  { icon: ClipboardCheck, text: 'Every order logged with slot & status' },
  { icon: Wallet, text: 'Live running balance per shop' },
  { icon: Bell, text: 'Both sides notified at every step' },
];

export default function ProblemSolution() {
  return (
    <section className="py-16 md:py-24 bg-surface border-y border-mist/60">
      <div className="max-w-6xl mx-auto px-5">
        <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl tracking-tight max-w-2xl">
          The chaos of pen-and-paper distribution, replaced.
        </h2>
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-mist bg-canvas/40 p-6">
            <p className="text-xs uppercase tracking-widest text-ink2 font-medium">Before</p>
            <ul className="mt-5 space-y-3">
              {PAINS.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-sm text-ink2">
                  <span className="w-9 h-9 rounded-lg bg-alert/10 text-alert grid place-items-center shrink-0"><p.icon size={17} /></span>
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-mist bg-surface p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-ok font-medium">With Amul Connect</p>
            <ul className="mt-5 space-y-3">
              {GAINS.map((g) => (
                <li key={g.text} className="flex items-center gap-3 text-sm text-ink">
                  <span className="w-9 h-9 rounded-lg bg-ok/10 text-ok grid place-items-center shrink-0"><g.icon size={17} /></span>
                  {g.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}