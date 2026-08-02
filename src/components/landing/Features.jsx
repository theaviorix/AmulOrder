import React from 'react';
import { Boxes, Clock, ScrollText, Wallet, PackageSearch, Bell, BarChart3, Repeat } from 'lucide-react';

const SUPPLIER = [
  { icon: Boxes, title: 'Live price list', text: 'Add products, set units & prices, toggle stock inline.' },
  { icon: Clock, title: 'AM / PM rounds', text: "Filter the day's orders by delivery round and act fast." },
  { icon: ScrollText, title: 'Supply summary', text: 'Accepted orders roll up into per-product totals.' },
  { icon: Wallet, title: 'Billing & part-payments', text: 'Generate bills, record partial payments, track aging.' },
];
const RETAILER = [
  { icon: PackageSearch, title: 'Order in seconds', text: 'Browse the catalogue and place an order for your slot.' },
  { icon: Bell, title: 'Live tracking', text: 'See placed → accepted → dispatched → billed live.' },
  { icon: BarChart3, title: 'Bills & balance', text: "See outstanding balance and each bill's progress." },
  { icon: Repeat, title: 'Reorder', text: 'Repeat your last order with a single tap.' },
];

function Column({ heading, items }) {
  return (
    <div className="rounded-2xl border border-mist bg-canvas/30 p-6 md:p-8">
      <h3 className="font-display font-semibold text-ink text-lg">{heading}</h3>
      <div className="mt-6 grid sm:grid-cols-2 gap-5">
        {items.map((f) => (
          <div key={f.title}>
            <span className="w-10 h-10 rounded-lg bg-jet text-surface grid place-items-center"><f.icon size={18} /></span>
            <h4 className="mt-3 font-medium text-ink text-sm">{f.title}</h4>
            <p className="mt-1 text-sm text-ink2 leading-relaxed">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-16 md:py-24 bg-surface border-y border-mist/60">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-warn font-medium">Features</p>
          <h2 className="mt-3 font-display font-semibold text-ink text-2xl md:text-3xl tracking-tight">One platform. Two sides. Total clarity.</h2>
        </div>
        <div className="mt-12 grid lg:grid-cols-2 gap-6">
          <Column heading="For Suppliers" items={SUPPLIER} />
          <Column heading="For Retailers" items={RETAILER} />
        </div>
      </div>
    </section>
  );
}