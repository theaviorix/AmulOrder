import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const PERKS = [
  'Unlimited products & price list',
  'Unlimited linked retailers',
  'AM / PM order pipeline',
  'Bills, partial payments & aging',
  'Per-shop ledger & statements',
  'In-app notifications, both sides',
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <p className="text-xs uppercase tracking-widest text-warn font-medium">Pricing</p>
        <h2 className="mt-3 font-display font-semibold text-ink text-2xl md:text-3xl tracking-tight">One simple plan. Per shop.</h2>
        <p className="mt-3 text-ink2">Start free. Upgrade when your pipeline fills up.</p>
        <div className="mt-10 rounded-3xl border border-mist bg-surface shadow-xl shadow-ink/5 p-8 md:p-10 text-left">
          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
            <div>
              <p className="font-mono text-sm text-ink2">Distributor plan</p>
              <p className="mt-2 font-display font-bold text-ink">
                <span className="text-4xl">₹499</span>
                <span className="text-ink2 font-normal text-base">/shop/mo</span>
              </p>
            </div>
            <div className="flex-1">
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink">
                    <Check size={16} className="text-ok mt-0.5 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/onboarding?role=supplier" className="text-center bg-jet text-surface font-medium px-6 py-3 rounded-xl hover:bg-ink transition-colors">Start as a Supplier</Link>
            <Link to="/onboarding?role=customer" className="text-center bg-surface text-ink font-medium px-6 py-3 rounded-xl border border-mist hover:border-ink2/30 transition-colors">Start as a Retailer</Link>
          </div>
          <p className="mt-4 text-xs text-ink2 text-center">14-day free trial · No card required</p>
        </div>
      </div>
    </section>
  );
}