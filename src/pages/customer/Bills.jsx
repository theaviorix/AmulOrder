import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Package, Star, Download } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { inr } from '@/lib/store';
import { downloadPDF } from '@/lib/exportUtils';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusPill from '@/components/StatusPill';
import SearchInput from '@/components/SearchInput';
import SortSelect from '@/components/SortSelect';
import Modal from '@/components/Modal';

export default function CustomerBills() {
  const store = useStore();
  const { session } = useSession();
  const uid = session.userId;
  const allBills = store.filter('bills', (b) => b.customer_user_id === uid)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const outstanding = allBills.filter((b) => b.status !== 'paid').reduce((s, b) => s + (b.total - b.paid_amount), 0);
  const allOrders = store.filter('orders', (o) => o.customer_user_id === uid).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const reviews = store.filter('reviews', (r) => r.customer_user_id === uid);
  const myProfile = session.profileId ? store.get('customer_profiles', session.profileId) : null;

  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest');
  const bills = q.trim() ? allBills.filter((b) => new Date(b.created_date).toLocaleDateString('en-IN').includes(q.trim())) : allBills;
  const orders = q.trim() ? allOrders.filter((o) => o.items.some((it) => it.name.toLowerCase().includes(q.trim().toLowerCase()))) : allOrders;
  const sortedBills = [...bills].sort((a, b) => sort === 'oldest' ? new Date(a.created_date) - new Date(b.created_date) : new Date(b.created_date) - new Date(a.created_date));
  const sortedOrders = [...orders].sort((a, b) => sort === 'oldest' ? new Date(a.created_date) - new Date(b.created_date) : new Date(b.created_date) - new Date(a.created_date));

  const downloadStatement = () => {
    const rows = [];
    rows.push(['Amul Connect — My statement', myProfile?.shop_name || '', new Date().toLocaleDateString('en-IN')]);
    rows.push([]);
    rows.push(['Outstanding balance (₹)', outstanding]);
    rows.push([]);
    rows.push(['Bills']);
    rows.push(['Date', 'Total (₹)', 'Paid (₹)', 'Due (₹)', 'Status']);
    allBills.forEach((b) => rows.push([new Date(b.created_date).toLocaleDateString('en-IN'), b.total, b.paid_amount, b.total - b.paid_amount, b.status]));
    rows.push([]);
    rows.push(['Orders']);
    rows.push(['Date', 'Round', 'Items', 'Total (₹)', 'Status']);
    allOrders.forEach((o) => rows.push([new Date(o.created_date).toLocaleDateString('en-IN'), o.slot, o.items.map((it) => `${it.name} x${it.quantity}`).join('; '), o.total, o.status]));
    downloadPDF(`${(myProfile?.shop_name || 'my').replace(/\s+/g, '_')}_statement.pdf`, rows, { title: 'Amul Connect — My statement' });
  };

  const [reviewing, setReviewing] = useState(null); // bill being reviewed
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const openReview = (b) => { setRating(5); setComment(''); setReviewing(b); };
  const submitReview = () => {
    const b = reviewing;
    store.create('reviews', {
      supplier_user_id: b.supplier_user_id,
      customer_user_id: uid,
      customer_name: myProfile?.shop_name || 'Retailer',
      bill_id: b.id,
      rating,
      comment: comment.trim(),
    });
    setReviewing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Bills & balance" sub="Your outstanding balance and payment progress." action={
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search bills/orders..." />
          <SortSelect value={sort} onChange={setSort} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }]} />
          <button onClick={downloadStatement} className="inline-flex items-center gap-1.5 text-sm font-medium border border-mist text-ink px-3.5 py-2.5 rounded-xl hover:bg-canvas transition-colors">
            <Download size={15} /> Download
          </button>
        </div>
      } />
      <div className="rounded-2xl bg-jet text-surface p-6">
        <p className="text-xs uppercase tracking-widest text-surface/60">Outstanding balance</p>
        <p className="mt-1 font-display font-bold text-4xl">{inr(outstanding)}</p>
        <p className="mt-2 text-sm text-surface/60">{allBills.length} bill{allBills.length === 1 ? '' : 's'} · {allBills.filter((b) => b.status === 'paid').length} settled</p>
      </div>

      <section>
        <h3 className="font-display font-semibold text-ink mb-2">Bills</h3>
        {sortedBills.length === 0 ? (
          <EmptyState icon={Wallet} title="No bills yet" hint="Bills appear here once your supplier bills an order." />
        ) : (
          <div className="grid gap-2">
            {sortedBills.map((b) => {
              const pct = b.total ? Math.round((b.paid_amount / b.total) * 100) : 0;
              const reviewed = reviews.some((r) => r.bill_id === b.id);
              return (
                <div key={b.id} className="rounded-2xl border border-mist bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-ink2 font-mono">{new Date(b.created_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <div className="flex items-center gap-1.5">{b.edited_flag && <span className="text-[10px] text-warn font-medium bg-warn/10 px-1.5 py-0.5 rounded">edited</span>}<StatusPill status={b.status} size="xs" /></div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-ink2">{inr(b.paid_amount)} of {inr(b.total)}</span>
                    <span className="font-mono text-ink">Due {inr(b.total - b.paid_amount)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-canvas overflow-hidden">
                    <div className={`h-full ${b.status === 'paid' ? 'bg-ok' : 'bg-warn'}`} style={{ width: `${pct}%` }} />
                  </div>
                  {b.status === 'paid' && (
                    reviewed ? (
                      <p className="mt-3 text-xs text-ink2">Thanks for your review ✓</p>
                    ) : (
                      <button onClick={() => openReview(b)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-mist text-ink hover:bg-canvas transition-colors">
                        <Star size={13} /> Rate this order
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-display font-semibold text-ink mb-2">Order history</h3>
        {sortedOrders.length === 0 ? (
          <EmptyState icon={Package} title="No orders yet" action={<Link to="/customer/new-order" className="text-sm font-medium bg-jet text-surface px-4 py-2 rounded-lg">Place an order</Link>} />
        ) : (
          <div className="rounded-2xl border border-mist bg-surface divide-y divide-mist/50 overflow-hidden">
            {sortedOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${o.slot === 'AM' ? 'bg-mist text-ink2' : 'bg-jet text-surface'}`}>{o.slot}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink">{o.items.length} item{o.items.length === 1 ? '' : 's'}</p>
                  <p className="text-[11px] text-ink2 font-mono">{new Date(o.created_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                </div>
                <StatusPill status={o.status} size="xs" />
                <span className="font-mono text-sm text-ink w-16 text-right">{inr(o.total)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={!!reviewing} onClose={() => setReviewing(null)} title="Rate this order"
        footer={<><button onClick={() => setReviewing(null)} className="px-4 py-2.5 rounded-xl border border-mist text-ink font-medium text-sm">Cancel</button><button onClick={submitReview} className="px-4 py-2.5 rounded-xl bg-jet text-surface font-medium text-sm">Submit review</button></>}>
        <div className="space-y-3">
          <div className="flex items-center gap-1 justify-center py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={28} className={n <= rating ? 'fill-warn text-warn' : 'text-mist'} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Anything you'd like to share? (optional)" className="w-full rounded-xl border border-mist bg-surface px-3.5 py-3 text-ink outline-none focus:border-ink" />
        </div>
      </Modal>
    </div>
  );
}
