import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Store, ShoppingCart, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-gradient-to-b from-mist/50 to-transparent rounded-full blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-ink2 bg-surface border border-mist rounded-full px-3 py-1.5 mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-warn" />
            Built for India’s dairy & FMCG distribution
          </span>
          <h1 className="font-display font-bold text-ink leading-[1.05] tracking-tight text-4xl sm:text-5xl md:text-6xl">
            Orders that never get<br className="hidden sm:block" /> lost in the noise.
          </h1>
          <p className="mt-6 text-base md:text-lg text-ink2 max-w-xl leading-relaxed">
            Amul Connect turns phone-call and WhatsApp ordering chaos into a clean, trackable pipeline — between distributors and the shops they serve.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
            <Link to="/register?role=supplier" className="group inline-flex items-center gap-2 bg-jet text-surface font-medium px-6 py-3.5 rounded-xl hover:bg-ink transition-all shadow-lg shadow-jet/10">
              <Store size={18} /> I’m a Supplier
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/register?role=customer" className="inline-flex items-center gap-2 bg-surface text-ink font-medium px-6 py-3.5 rounded-xl border border-mist hover:border-ink2/30 transition-all">
              <ShoppingCart size={18} /> I’m a Retailer
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink2">
            {['No setup fees', 'AM / PM delivery rounds', 'Running balance ledger'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-ok" /> {t}</span>
            ))}
          </div>
        </div>
        <div className="mt-14 md:mt-20"><HeroMock /></div>
      </div>
    </section>
  );
}

function HeroMock() {
  const rows = [
    { shop: 'Sharma Kirana', slot: 'AM', items: 6, total: '₹2,450', status: 'placed' },
    { shop: 'FreshMart', slot: 'PM', items: 4, total: '₹1,820', status: 'accepted' },
    { shop: 'Sai General', slot: 'AM', items: 8, total: '₹3,160', status: 'dispatched' },
  ];
  const tone = (s) => s === 'placed' ? 'bg-mist text-ink2' : s === 'accepted' ? 'bg-warn/15 text-warn' : 'bg-ok/15 text-ok';
  return (
    <div className="rounded-2xl border border-mist bg-surface shadow-2xl shadow-ink/10 overflow-hidden max-w-4xl mx-auto">
      <div className="flex items-center gap-1.5 px-4 h-9 bg-canvas/60 border-b border-mist">
        <span className="w-2.5 h-2.5 rounded-full bg-alert/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-warn/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-ok/40" />
      </div>
      <div className="grid md:grid-cols-[200px_1fr]">
        <div className="hidden md:block bg-jet text-surface p-4 space-y-1">
          <div className="font-display font-semibold mb-2">Today</div>
          {['Orders', 'Products', 'Customers', 'Billing'].map((t, i) => (
            <div key={t} className={`text-sm px-2.5 py-1.5 rounded-lg ${i === 0 ? 'bg-surface/15' : 'text-surface/60'}`}>{t}</div>
          ))}
        </div>
        <div className="p-4 md:p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold text-ink text-sm">Today’s orders</p>
            <span className="text-[11px] font-mono text-ink2 bg-canvas px-2 py-1 rounded-md">3 new</span>
          </div>
          {rows.map((r) => (
            <div key={r.shop} className="flex items-center gap-3 rounded-xl border border-mist bg-canvas/30 px-3 py-2.5">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tone(r.status)}`}>{r.slot} · {r.status}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{r.shop}</p>
                <p className="text-[11px] text-ink2">{r.items} items</p>
              </div>
              <span className="font-mono text-sm text-ink">{r.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}