import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Truck, Wallet, Users, Star } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { inr } from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatusPill from '@/components/StatusPill';
import EmptyState from '@/components/EmptyState';

export default function SupplierOverview() {
  const store = useStore();
  const { session } = useSession();
  const uid = session.userId;

  const orders = store.filter('orders', (o) => o.supplier_user_id === uid);
  const bills = store.filter('bills', (b) => b.supplier_user_id === uid);
  const customers = store.filter('supplier_links', (l) => l.supplier_user_id === uid && l.status === 'active');

  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_date).toDateString() === todayStr);
  const newOrders = orders.filter((o) => o.status === 'placed');
  const pendingDispatch = orders.filter((o) => o.status === 'accepted');
  const outstanding = bills.filter((b) => b.status !== 'paid').reduce((s, b) => s + (b.total - b.paid_amount), 0);

  const stats = [
    { label: "Today's orders", value: todayOrders.length, icon: ClipboardList, to: '/supplier/orders' },
    { label: 'New / placed', value: newOrders.length, icon: ClipboardList, to: '/supplier/orders' },
    { label: 'Awaiting dispatch', value: pendingDispatch.length, icon: Truck, to: '/supplier/orders' },
    { label: 'Outstanding', value: inr(outstanding), icon: Wallet, to: '/supplier/billing' },
    { label: 'Active retailers', value: customers.length, icon: Users, to: '/supplier/customers' },
  ];

  const roundTotals = (slot) => {
    const map = {};
    pendingDispatch.filter((o) => o.slot === slot).forEach((o) => o.items.forEach((it) => {
      const k = `${it.name} · ${it.unit}`;
      map[k] = (map[k] || 0) + it.quantity;
    }));
    return Object.entries(map);
  };
  const amTotals = roundTotals('AM');
  const pmTotals = roundTotals('PM');

  const recent = [...orders].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6);
  const reviews = store.filter('reviews', (r) => r.supplier_user_id === uid).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" sub="Your distribution day at a glance." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="rounded-2xl border border-mist bg-surface p-4 hover:border-ink2/30 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-canvas text-ink grid place-items-center"><s.icon size={17} /></span>
            <p className="mt-3 font-display font-bold text-ink text-2xl leading-none">{s.value}</p>
            <p className="mt-1 text-xs text-ink2">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Supply summary — AM round">
          <RoundList entries={amTotals} empty="No accepted orders for the AM round yet." />
        </Card>
        <Card title="Supply summary — PM round">
          <RoundList entries={pmTotals} empty="No accepted orders for the PM round yet." />
        </Card>
      </div>

      <Card title="Recent orders" link={{ to: '/supplier/orders', label: 'View all' }}>
        {recent.length ? (
          <div className="divide-y divide-mist/50">
            {recent.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-2.5">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${o.slot === 'AM' ? 'bg-mist text-ink2' : 'bg-jet text-surface'}`}>{o.slot}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{o.customer_name}</p>
                  <p className="text-[11px] text-ink2">{o.items.length} items</p>
                </div>
                <StatusPill status={o.status} size="xs" />
                <span className="font-mono text-sm text-ink w-20 text-right">{inr(o.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No orders yet" hint="New orders from your retailers will appear here." action={<Link to="/supplier/products" className="text-sm font-medium bg-jet text-surface px-4 py-2 rounded-lg">Set up your price list</Link>} />
        )}
      </Card>

      <Card title="Customer reviews">
        {reviews.length === 0 ? (
          <p className="text-sm text-ink2 py-6 text-center">No reviews yet — they’ll show up once retailers rate a settled bill.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-2xl text-ink">{avgRating.toFixed(1)}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} className={n <= Math.round(avgRating) ? 'fill-warn text-warn' : 'text-mist'} />)}
              </div>
              <span className="text-xs text-ink2">({reviews.length} review{reviews.length === 1 ? '' : 's'})</span>
            </div>
            <div className="divide-y divide-mist/50">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{r.customer_name}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={12} className={n <= r.rating ? 'fill-warn text-warn' : 'text-mist'} />)}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-ink2 mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function RoundList({ entries, empty }) {
  if (!entries.length) return <p className="text-sm text-ink2 py-6 text-center">{empty}</p>;
  return (
    <div className="divide-y divide-mist/50">
      {entries.map(([k, q]) => (
        <div key={k} className="flex justify-between text-sm py-1.5">
          <span className="text-ink">{k}</span>
          <span className="font-mono text-ink2">{q}</span>
        </div>
      ))}
    </div>
  );
}