import React, { useState, useMemo } from 'react';
import { Table2, Download, Sunrise, Sunset, CalendarDays } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { inr } from '@/lib/store';
import { downloadPDF } from '@/lib/exportUtils';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDate(iso, dateStr) {
  const d = new Date(iso);
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return local === dateStr;
}

// Builds a customer x product matrix for a given list of orders.
function buildMatrix(orders) {
  const productCols = []; // ordered list of "Name · Unit" keys
  const productSeen = new Set();
  const customerRows = new Map(); // customer_user_id -> { name, cells: Map(key->qty), total }

  orders.forEach((o) => {
    if (!customerRows.has(o.customer_user_id)) {
      customerRows.set(o.customer_user_id, { name: o.customer_name, cells: new Map(), total: 0 });
    }
    const row = customerRows.get(o.customer_user_id);
    row.total += Number(o.total) || 0;
    o.items.forEach((it) => {
      const key = `${it.name}${it.unit ? ' · ' + it.unit : ''}`;
      if (!productSeen.has(key)) { productSeen.add(key); productCols.push(key); }
      row.cells.set(key, (row.cells.get(key) || 0) + (Number(it.quantity) || 0));
    });
  });

  productCols.sort((a, b) => a.localeCompare(b));
  const rows = [...customerRows.values()].sort((a, b) => a.name.localeCompare(b.name));
  const colTotals = productCols.map((key) => rows.reduce((s, r) => s + (r.cells.get(key) || 0), 0));
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  return { productCols, rows, colTotals, grandTotal };
}

function Matrix({ data, emptyHint }) {
  if (data.rows.length === 0) {
    return <EmptyState icon={Table2} title="No orders" hint={emptyHint} />;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-mist bg-surface">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-canvas/60">
            <th className="sticky left-0 bg-canvas/60 text-left px-3.5 py-2.5 font-medium text-ink2 text-xs uppercase tracking-wide whitespace-nowrap">Customer</th>
            {data.productCols.map((c) => (
              <th key={c} className="px-3 py-2.5 text-right font-medium text-ink2 text-xs uppercase tracking-wide whitespace-nowrap">{c}</th>
            ))}
            <th className="px-3.5 py-2.5 text-right font-medium text-ink2 text-xs uppercase tracking-wide whitespace-nowrap">Total ₹</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-mist/50">
          {data.rows.map((r) => (
            <tr key={r.name} className="hover:bg-canvas/30">
              <td className="sticky left-0 bg-surface px-3.5 py-2.5 font-medium text-ink whitespace-nowrap">{r.name}</td>
              {data.productCols.map((c) => (
                <td key={c} className="px-3 py-2.5 text-right font-mono text-ink2">{r.cells.get(c) || '—'}</td>
              ))}
              <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-ink">{inr(r.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-canvas/60 border-t-2 border-mist">
            <td className="sticky left-0 bg-canvas/60 px-3.5 py-2.5 font-semibold text-ink">Total qty</td>
            {data.colTotals.map((t, i) => (
              <td key={i} className="px-3 py-2.5 text-right font-mono font-semibold text-ink">{t}</td>
            ))}
            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-ink">{inr(data.grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function SupplierBillSheet() {
  const store = useStore();
  const { session } = useSession();
  const uid = session.userId;
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState('all'); // 'all' | 'AM' | 'PM'

  const allOrdersForDate = useMemo(() => {
    return store.filter('orders', (o) => o.supplier_user_id === uid && o.status !== 'cancelled' && o.status !== 'rejected' && isSameDate(o.created_date, date));
  }, [store, uid, date]);

  const amOrders = allOrdersForDate.filter((o) => o.slot === 'AM');
  const pmOrders = allOrdersForDate.filter((o) => o.slot === 'PM');

  const matrixAll = useMemo(() => buildMatrix(allOrdersForDate), [allOrdersForDate]);
  const matrixAM = useMemo(() => buildMatrix(amOrders), [amOrders]);
  const matrixPM = useMemo(() => buildMatrix(pmOrders), [pmOrders]);

  const activeMatrix = tab === 'AM' ? matrixAM : tab === 'PM' ? matrixPM : matrixAll;
  const activeLabel = tab === 'AM' ? 'Morning (AM)' : tab === 'PM' ? 'Evening (PM)' : 'Full day (AM + PM)';

  const exportCurrent = () => {
    const rows = [];
    rows.push(['Amul Connect — Bill Sheet', date, activeLabel]);
    rows.push([]);
    rows.push(['Customer', ...activeMatrix.productCols, 'Total (₹)']);
    activeMatrix.rows.forEach((r) => {
      rows.push([r.name, ...activeMatrix.productCols.map((c) => r.cells.get(c) || 0), r.total]);
    });
    rows.push(['Total qty', ...activeMatrix.colTotals, activeMatrix.grandTotal]);
    downloadPDF(`bill-sheet_${date}_${tab}.pdf`, rows, { title: 'Amul Connect — Bill Sheet' });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Total bill sheet"
        sub="Every product, every customer, one day — pick a date to see the full order sheet."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2 pointer-events-none" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-mist bg-surface pl-9 pr-3 py-2.5 text-sm text-ink outline-none focus:border-ink" />
            </div>
            <button onClick={exportCurrent} className="inline-flex items-center gap-1.5 text-sm font-medium bg-jet text-surface px-4 py-2.5 rounded-xl hover:bg-ink transition-colors">
              <Download size={15} /> Export PDF
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-mist bg-surface p-4">
          <p className="text-xs text-ink2 flex items-center gap-1.5"><Sunrise size={13} /> Morning total</p>
          <p className="mt-1 font-display font-bold text-xl text-ink">{inr(matrixAM.grandTotal)}</p>
        </div>
        <div className="rounded-2xl border border-mist bg-surface p-4">
          <p className="text-xs text-ink2 flex items-center gap-1.5"><Sunset size={13} /> Evening total</p>
          <p className="mt-1 font-display font-bold text-xl text-ink">{inr(matrixPM.grandTotal)}</p>
        </div>
        <div className="rounded-2xl bg-jet text-surface p-4">
          <p className="text-xs text-surface/60">Full day total</p>
          <p className="mt-1 font-display font-bold text-xl">{inr(matrixAll.grandTotal)}</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {[['all', 'Full day'], ['AM', 'Morning'], ['PM', 'Evening']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} className={`text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors ${tab === val ? 'bg-jet text-surface' : 'bg-surface border border-mist text-ink2 hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      <Matrix data={activeMatrix} emptyHint={`No ${tab === 'all' ? '' : tab + ' round '}orders placed on this date.`} />
    </div>
  );
}
