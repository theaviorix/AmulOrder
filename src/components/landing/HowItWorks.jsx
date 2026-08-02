import React from 'react';
import { Store, ClipboardList, Truck } from 'lucide-react';

const STEPS = [
  { n: '01', icon: Store, title: 'Set up your shop', text: 'A supplier adds their products & prices, then shares a unique invite code with their retailers.' },
  { n: '02', icon: ClipboardList, title: 'Retailers order themselves', text: 'Shops browse the live price list and place an order for the next AM or PM delivery round.' },
  { n: '03', icon: Truck, title: 'Accept, dispatch & bill', text: 'The supplier confirms quantities, dispatches the round, and generates a bill with a tracked balance.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-warn font-medium">How it works</p>
          <h2 className="mt-3 font-display font-semibold text-ink text-2xl md:text-3xl tracking-tight">Three steps. Zero phone calls.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-mist bg-surface p-6 shadow-sm">
              <span className="font-mono text-xs text-ink2">{s.n}</span>
              <span className="mt-3 w-11 h-11 rounded-xl bg-jet text-surface grid place-items-center"><s.icon size={20} /></span>
              <h3 className="mt-4 font-display font-semibold text-ink text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-ink2 leading-relaxed">{s.text}</p>
              {i < STEPS.length - 1 && <span className="hidden md:block absolute top-9 -right-3 text-mist font-mono text-lg">→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}