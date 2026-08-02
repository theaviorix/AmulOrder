import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer, ScrollText, Package } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { inr } from '@/lib/store';
import { downloadPDF } from '@/lib/exportUtils';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import StatusPill from '@/components/StatusPill';
import SortSelect from '@/components/SortSelect';

export default function SupplierCustomerHistory() {
  const { linkId } = useParams();
  const store = useStore();
  const { session } = useSession();
  const uid = session.userId;

  const supplierProfile = session.profileId ? store.get('supplier_profiles', session.profileId) : null;
  const link = store.get('supplier_links', linkId);
  const customerProfile = link?.customer_profile_id ? store.get('customer_profiles', link.customer_profile_id) : null;
  // The store's Firestore listeners populate asynchronously on first load;
  // this stays true only until the supplier_links cache has synced once.
  const loadingProfiles = !store.isReady('supplier_links');

  const [sort, setSort] = useState('newest');

  const orders = useMemo(() => {
    if (!link) return [];
    const list = store.filter('orders', (o) => o.supplier_user_id === uid && o.customer_user_id === link.customer_user_id);
    return list.sort((a, b) => sort === 'newest' ? new Date(b.created_date) - new Date(a.created_date) : new Date(a.created_date) - new Date(b.created_date));
  }, [store, uid, link, sort]);

  const bills = useMemo(() => {
    if (!link) return [];
    return store.filter('bills', (b) => b.supplier_user_id === uid && b.customer_user_id === link.customer_user_id)
      .sort((a, b) => sort === 'newest' ? new Date(b.created_date) - new Date(a.created_date) : new Date(a.created_date) - new Date(b.created_date));
  }, [store, uid, link, sort]);

  if (loadingProfiles) {
    return <div className="w-8 h-8 border-4 border-mist border-t-ink rounded-full animate-spin" />;
  }

  if (!link) {
    return (
      <div className="space-y-5">
        <Link to="/supplier/customers" className="inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-ink"><ArrowLeft size={15} /> Back to customers</Link>
        <EmptyState icon={Package} title="Customer not found" hint="This link may have been removed." />
      </div>
    );
  }

  const totalOrdered = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const totalBilled = bills.reduce((s, b) => s + (Number(b.total) || 0), 0);
  const totalPaid = bills.reduce((s, b) => s + (Number(b.paid_amount) || 0), 0);
  const outstanding = totalBilled - totalPaid;

  const exportHistory = () => {
    const rows = [];
    rows.push(['Amul Connect — Transaction history', link.customer_name, new Date().toLocaleDateString('en-IN')]);
    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Total ordered (₹)', totalOrdered]);
    rows.push(['Total billed (₹)', totalBilled]);
    rows.push(['Total paid (₹)', totalPaid]);
    rows.push(['Outstanding (₹)', outstanding]);
    rows.push([]);
    rows.push(['Orders']);
    rows.push(['Date', 'Time', 'Round', 'Status', 'Items', 'Total (₹)']);
    orders.forEach((o) => {
      rows.push([
        new Date(o.created_date).toLocaleDateString('en-IN'),
        new Date(o.created_date).toLocaleTimeString('en-IN'),
        o.slot,
        o.status,
        o.items.map((it) => `${it.name} x${it.quantity}`).join('; '),
        o.total,
      ]);
    });
    rows.push([]);
    rows.push(['Bills & payments']);
    rows.push(['Date', 'Bill total (₹)', 'Paid (₹)', 'Due (₹)', 'Status', 'Payment history']);
    bills.forEach((b) => {
      rows.push([
        new Date(b.created_date).toLocaleDateString('en-IN'),
        b.total,
        b.paid_amount,
        b.total - b.paid_amount,
        b.status,
        (b.payments || []).map((p) => `${inr(p.amount)} on ${new Date(p.date).toLocaleDateString('en-IN')}`).join('; '),
      ]);
    });
    downloadPDF(`${link.customer_name.replace(/\s+/g, '_')}_history.pdf`, rows, { title: 'Amul Connect — Customer History' });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <Link to="/supplier/customers" className="inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-ink"><ArrowLeft size={15} /> Back to customers</Link>
        <div className="flex gap-2">
          <button onClick={exportHistory} className="inline-flex items-center gap-1.5 text-sm font-medium border border-mist text-ink px-3.5 py-2.5 rounded-xl hover:bg-canvas transition-colors"><Download size={15} /> Export PDF</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-sm font-medium border border-mist text-ink px-3.5 py-2.5 rounded-xl hover:bg-canvas transition-colors"><Printer size={15} /> Print</button>
        </div>
      </div>

      <div className="rounded-2xl bg-jet text-surface p-5 flex items-center gap-4">
        <Avatar src={customerProfile?.avatar} name={link.customer_name} size="lg" className="ring-2 ring-surface/20" />
        <div>
          <p className="font-display font-bold text-xl">{link.customer_name}</p>
          <p className="text-sm text-surface/60">{customerProfile?.phone || 'No phone on file'} {customerProfile?.address ? `· ${customerProfile.address}` : ''}</p>
          <div className="mt-1"><StatusPill status={link.status} size="xs" /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total ordered" value={inr(totalOrdered)} />
        <Stat label="Total billed" value={inr(totalBilled)} />
        <Stat label="Total paid" value={inr(totalPaid)} />
        <Stat label="Outstanding" value={inr(outstanding)} tone={outstanding > 0 ? 'alert' : 'ok'} />
      </div>

      <div className="flex items-center justify-between print:hidden">
        <h3 className="font-display font-semibold text-ink">Order history ({orders.length})</h3>
        <SortSelect value={sort} onChange={setSort} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }]} />
      </div>
      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" />
      ) : (
        <div className="rounded-2xl border border-mist bg-surface overflow-hidden divide-y divide-mist/50">
          {orders.map((o) => (
            <div key={o.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${o.slot === 'AM' ? 'bg-mist text-ink2' : 'bg-jet text-surface'}`}>{o.slot}</span>
                  <span className="text-xs text-ink2 font-mono">{new Date(o.created_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <StatusPill status={o.status} size="xs" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {o.items.map((it, i) => <span key={i} className="text-xs bg-canvas text-ink2 rounded-lg px-2 py-1">{it.name} × {it.quantity}</span>)}
              </div>
              <div className="mt-2 text-right font-mono font-semibold text-ink text-sm">{inr(o.total)}</div>
            </div>
          ))}
        </div>
      )}

      <h3 className="font-display font-semibold text-ink">Bills & payments ({bills.length})</h3>
      {bills.length === 0 ? (
        <EmptyState icon={ScrollText} title="No bills yet" />
      ) : (
        <div className="rounded-2xl border border-mist bg-surface overflow-hidden divide-y divide-mist/50">
          {bills.map((b) => (
            <div key={b.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-ink2 font-mono">{new Date(b.created_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <StatusPill status={b.status} size="xs" />
              </div>
              <div className="mt-1.5 flex justify-between text-sm">
                <span className="text-ink2">{inr(b.paid_amount)} of {inr(b.total)} paid</span>
                <span className="font-mono text-ink">Due {inr(b.total - b.paid_amount)}</span>
              </div>
              {(b.payments || []).length > 0 && (
                <div className="mt-2 text-xs text-ink2 space-y-0.5">
                  {b.payments.map((p, i) => (
                    <p key={i}>Payment of {inr(p.amount)} on {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-mist bg-surface p-4">
      <p className="text-xs text-ink2">{label}</p>
      <p className={`mt-1 font-display font-bold text-lg ${tone === 'alert' ? 'text-alert' : tone === 'ok' ? 'text-ok' : 'text-ink'}`}>{value}</p>
    </div>
  );
}
