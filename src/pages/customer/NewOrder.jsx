import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Repeat, BellRing, ChevronDown, Check } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { inr } from '@/lib/store';
import { notify } from '@/lib/notify';
import { getReminderSettings, setReminderSettings } from '@/lib/orderReminder';
import { QTY_STEP, roundToStep } from '@/lib/quantity';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';

export default function CustomerNewOrder() {
  const store = useStore();
  const { session } = useSession();
  const navigate = useNavigate();
  const supUid = session.supplierUserId;
  const profile = session.profileId ? store.get('customer_profiles', session.profileId) : null;
  const shopName = profile?.shop_name || 'Shop';
  const products = useMemo(
    () => (supUid ? store.filter('products', (p) => p.supplier_user_id === supUid && p.active).sort((a, b) => a.name.localeCompare(b.name)) : []),
    [supUid, store]
  );
  const orders = store.filter('orders', (o) => o.customer_user_id === session.userId);
  const last = [...orders].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

  const [slot, setSlot] = useState('AM');
  const [cart, setCart] = useState({});
  const [placing, setPlacing] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const total = useMemo(() => products.reduce((s, p) => s + (cart[p.id] || 0) * p.price, 0), [cart, products]);
  const count = Object.values(cart).filter((q) => q > 0).length;
  const reviewItems = products.filter((p) => cart[p.id] > 0);

  const reorder = () => {
    if (!last) return;
    const c = {};
    last.items.forEach((it) => {
      const prod = products.find((p) => p.id === it.product_id) || products.find((p) => p.name === it.name && p.unit === it.unit);
      if (prod) c[prod.id] = it.quantity;
    });
    setCart(c);
  };

  const openReview = () => {
    if (count === 0) return;
    setReviewing(true);
  };

  const place = () => {
    if (count === 0) return;
    setPlacing(true);
    const items = products.filter((p) => cart[p.id] > 0).map((p) => ({ product_id: p.id, name: p.name, unit: p.unit, price: p.price, quantity: Number(cart[p.id]) }));
    const tot = items.reduce((s, it) => s + it.price * it.quantity, 0);
    store.create('orders', { supplier_user_id: supUid, customer_user_id: session.userId, customer_name: shopName, slot, status: 'placed', items, total: tot, adjusted_flag: false, edited_flag: false });
    notify(supUid, 'order_placed', `New order received from ${shopName} (${slot} round).`, '/supplier/orders');
    setReviewing(false);
    navigate('/customer/orders');
  };

  return (
    <div className="space-y-5 pb-28">
      <PageHeader title="New order" sub="Browse the live price list and place your order for the next round." action={last && (
        <button onClick={reorder} className="inline-flex items-center gap-1.5 text-sm font-medium border border-mist text-ink px-3.5 py-2.5 rounded-xl hover:bg-canvas transition-colors"><Repeat size={15} /> Repeat last order</button>
      )} />

      <ReminderCard profile={profile} />

      <div className="flex gap-2">
        {[['AM', 'Morning'], ['PM', 'Evening']].map(([val, label]) => (
          <button key={val} onClick={() => setSlot(val)} className={`flex-1 rounded-xl border p-3 text-left transition-colors ${slot === val ? 'border-jet bg-surface' : 'border-mist bg-canvas/30'}`}>
            <p className="font-mono text-xs text-ink2">{val} round</p><p className="font-medium text-ink">{label} delivery</p>
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No products available" hint="Your supplier hasn't listed any products yet. Check back soon." />
      ) : (
        <div className="grid gap-2">
          {products.map((p) => (
            <ProductRow key={p.id} p={p} qty={cart[p.id] || 0}
              onAdd={() => setCart((c) => ({ ...c, [p.id]: roundToStep((c[p.id] || 0) + QTY_STEP) }))}
              onDec={() => setCart((c) => ({ ...c, [p.id]: roundToStep((c[p.id] || 0) - QTY_STEP) }))}
              onSet={(v) => setCart((c) => ({ ...c, [p.id]: roundToStep(v) }))}
            />
          ))}
        </div>
      )}

      <div className={`fixed bottom-0 left-0 right-0 lg:left-64 z-30 transition-transform duration-300 ${count > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <div className="rounded-2xl bg-jet text-surface shadow-2xl flex items-center justify-between px-4 py-3">
            <div className="text-sm">
              <p className="font-mono text-surface/60">{count} item{count === 1 ? '' : 's'} · {slot} round</p>
              <p className="font-display font-bold text-xl">{inr(total)}</p>
            </div>
            <button onClick={openReview} disabled={placing} className="bg-surface text-jet font-medium px-5 py-3 rounded-xl hover:bg-canvas transition-colors">Review order</button>
          </div>
        </div>
      </div>

      <Modal open={reviewing} onClose={() => setReviewing(false)} title="Review your order" size="lg"
        footer={<>
          <button onClick={() => setReviewing(false)} className="px-4 py-2.5 rounded-xl border border-mist text-ink font-medium text-sm">Back to edit</button>
          <button onClick={place} disabled={placing || count === 0} className="px-4 py-2.5 rounded-xl bg-jet text-surface font-medium text-sm inline-flex items-center gap-1.5 disabled:opacity-50"><Check size={15} /> Confirm order</button>
        </>}>
        <div className="space-y-3">
          <p className="text-sm text-ink2">{shopName} · <span className="font-mono">{slot} round</span></p>
          <div className="rounded-xl border border-mist divide-y divide-mist/60">
            {reviewItems.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2.5">
                <span className="flex-1 text-sm text-ink">{p.name} <span className="text-ink2">· {p.unit} · {inr(p.price)}</span></span>
                <button onClick={() => setCart((c) => ({ ...c, [p.id]: roundToStep((c[p.id] || 0) - QTY_STEP) }))} className="w-7 h-7 rounded-lg border border-mist text-ink grid place-items-center hover:bg-canvas"><Minus size={13} /></button>
                <input type="number" min="0" step="0.5" value={cart[p.id] || 0} onChange={(e) => setCart((c) => ({ ...c, [p.id]: roundToStep(e.target.value) }))} className="w-14 text-center border border-mist rounded-lg py-1 text-ink font-mono text-sm outline-none focus:border-ink" />
                <button onClick={() => setCart((c) => ({ ...c, [p.id]: roundToStep((c[p.id] || 0) + QTY_STEP) }))} className="w-7 h-7 rounded-lg bg-jet text-surface grid place-items-center"><Plus size={13} /></button>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm pt-1"><span className="text-ink2">Total</span><span className="font-mono font-semibold text-ink">{inr(total)}</span></div>
          <p className="text-xs text-ink2">Double-check quantities above — you can still adjust them here before confirming.</p>
        </div>
      </Modal>
    </div>
  );
}

function ReminderCard({ profile }) {
  const [open, setOpen] = useState(false);
  const settings = getReminderSettings(profile);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [time, setTime] = useState(settings.time);
  const [saved, setSaved] = useState(false);

  const save = (nextEnabled, nextTime) => {
    if (!profile) return;
    setReminderSettings(profile.id, { enabled: nextEnabled, time: nextTime });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    save(next, time);
  };

  const changeTime = (v) => {
    setTime(v);
    save(enabled, v);
  };

  return (
    <div className="rounded-2xl border border-mist bg-surface overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <BellRing size={16} className={enabled ? 'text-jet' : 'text-ink2'} />
          Daily order reminder {enabled && <span className="font-mono text-xs text-ink2">· {time}</span>}
        </span>
        <ChevronDown size={16} className={`text-ink2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
            <input type="checkbox" checked={enabled} onChange={toggle} className="w-4 h-4 accent-jet" />
            Remind me every day at
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => changeTime(e.target.value)}
            disabled={!enabled}
            className="rounded-lg border border-mist bg-canvas px-3 py-1.5 text-sm text-ink font-mono outline-none focus:border-ink disabled:opacity-50"
          />
          {saved && <span className="text-xs text-ok">Saved ✓</span>}
          <p className="w-full text-xs text-ink2 mt-1">Only fires while this app is open in your browser (no push notifications yet).</p>
        </div>
      )}
    </div>
  );
}

function ProductRow({ p, qty, onAdd, onDec, onSet }) {
  const out = p.in_stock === false;
  return (
    <div className={`rounded-2xl border border-mist bg-surface p-3.5 flex items-center gap-3 ${out ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink truncate">{p.name}</p>
        <p className="text-xs text-ink2">{p.unit} · <span className="font-mono text-ink">{inr(p.price)}</span></p>
      </div>
      {out ? (
        <span className="text-xs text-ink2 px-2.5 py-1.5 rounded-lg bg-canvas">Out of stock</span>
      ) : (
        <div className="flex items-center gap-1.5">
          <button onClick={onDec} className="w-8 h-8 rounded-lg border border-mist text-ink grid place-items-center hover:bg-canvas"><Minus size={15} /></button>
          <input type="number" min="0" step="0.5" value={qty} onChange={(e) => onSet(e.target.value)} className="w-14 text-center border border-mist rounded-lg py-1.5 text-ink font-mono text-sm outline-none focus:border-ink" />
          <button onClick={onAdd} className="w-8 h-8 rounded-lg bg-jet text-surface grid place-items-center"><Plus size={15} /></button>
        </div>
      )}
    </div>
  );
}