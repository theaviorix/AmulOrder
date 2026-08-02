import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { inr, daysSince } from '@/lib/store';
import { notify } from '@/lib/notify';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusPill from '@/components/StatusPill';
import Modal from '@/components/Modal';
import SearchInput from '@/components/SearchInput';
import SortSelect from '@/components/SortSelect';

export default function SupplierBilling() {
  const store = useStore();
  const { session } = useSession();
  const uid = session.userId;
  const [pay, setPay] = useState(null);
  const [amount, setAmount] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('due_oldest');

  const bills = store.filter('bills', (b) => b.supplier_user_id === uid);
  const searched = q.trim() ? bills.filter((b) => b.customer_name.toLowerCase().includes(q.trim().toLowerCase())) : bills;
  const sorted = [...searched].sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_date) - new Date(a.created_date);
    if (sort === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
    if (sort === 'amount_high') return (b.total - b.paid_amount) - (a.total - a.paid_amount);
    // default: due_oldest — unpaid bills first (oldest first), settled bills last
    const ao = a.status === 'paid' ? 1 : 0, bo = b.status === 'paid' ? 1 : 0;
    if (ao !== bo) return ao - bo;
    return new Date(a.created_date) - new Date(b.created_date);
  });
  const totalOutstanding = bills.filter((b) => b.status !== 'paid').reduce((s, b) => s + (b.total - b.paid_amount), 0);
  const overdueCount = bills.filter((b) => b.status !== 'paid' && daysSince(b.created_date) > 3).length;

  const recordPayment = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    const bill = pay;
    const newPaid = Math.min(bill.total, bill.paid_amount + amt);
    const status = newPaid >= bill.total ? 'paid' : 'partial';
    const payments = [...(bill.payments || []), { amount: amt, date: new Date().toISOString() }];
    store.update('bills', bill.id, { paid_amount: newPaid, status, payments });
    notify(bill.customer_user_id, 'payment_recorded', `${inr(amt)} recorded against your bill.${status === 'paid' ? ' Bill settled!' : ''}`, '/customer/bills');
    setPay(null); setAmount('');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Billing" sub="Bills, partial payments and aging — oldest unpaid first." action={
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search by customer..." />
          <SortSelect value={sort} onChange={setSort} options={[
            { value: 'due_oldest', label: 'Unpaid, oldest first' },
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'amount_high', label: 'Amount due: high to low' },
          ]} />
        </div>
      } />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total outstanding" value={inr(totalOutstanding)} />
        <Stat label="Overdue (>3 days)" value={overdueCount} tone={overdueCount ? 'alert' : 'ok'} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={Wallet} title="No bills yet" hint="Bills are generated when you bill a dispatched order." />
      ) : (
        <div className="grid gap-2">
          {sorted.map((b) => {
            const due = b.total - b.paid_amount;
            const overdue = b.status !== 'paid' && daysSince(b.created_date) > 3;
            const pct = b.total ? Math.round((b.paid_amount / b.total) * 100) : 0;
            return (
              <div key={b.id} className={`rounded-2xl border bg-surface p-4 ${overdue ? 'border-alert/40' : 'border-mist'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{b.customer_name}</p>
                    <p className="text-xs text-ink2 font-mono">
                      {new Date(b.created_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {b.status !== 'paid' ? ` · ${daysSince(b.created_date)}d outstanding` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">{b.edited_flag && <span className="text-[10px] text-warn font-medium bg-warn/10 px-1.5 py-0.5 rounded">edited</span>}<StatusPill status={b.status} size="xs" /></div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink2">{inr(b.paid_amount)} of {inr(b.total)}</span>
                    <span className="font-mono text-ink">Due {inr(due)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-canvas overflow-hidden">
                    <div className={`h-full ${b.status === 'paid' ? 'bg-ok' : 'bg-warn'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {b.status !== 'paid' && (
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => { setPay(b); setAmount(String(due)); }} className="text-xs font-medium px-3.5 py-2 rounded-lg bg-jet text-surface hover:bg-ink">Record payment</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!pay} onClose={() => setPay(null)} title="Record payment"
        footer={<><button onClick={() => setPay(null)} className="px-4 py-2.5 rounded-xl border border-mist text-ink font-medium text-sm">Cancel</button><button onClick={recordPayment} className="px-4 py-2.5 rounded-xl bg-jet text-surface font-medium text-sm">Record</button></>}>
        {pay && (
          <>
            <p className="text-sm text-ink2 mb-3">{pay.customer_name} · Total {inr(pay.total)} · Due {inr(pay.total - pay.paid_amount)}</p>
            <label className="block">
              <span className="text-xs font-medium text-ink2 mb-1.5 block">Amount received (₹)</span>
              <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus className="w-full rounded-xl border border-mist bg-surface px-3.5 py-3 text-ink text-[16px] outline-none focus:border-ink" />
            </label>
            <p className="mt-2 text-xs text-ink2">Partial payments are supported — the balance updates automatically.</p>
          </>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-mist bg-surface p-4">
      <p className="text-xs text-ink2">{label}</p>
      <p className={`mt-1 font-display font-bold text-2xl ${tone === 'alert' ? 'text-alert' : tone === 'ok' ? 'text-ok' : 'text-ink'}`}>{value}</p>
    </div>
  );
}