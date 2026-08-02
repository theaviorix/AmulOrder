import React, { useState, useMemo } from 'react';
import { ClipboardList, Check, Truck, ScrollText, Pencil, X, Boxes, Zap, MessageSquareWarning } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { inr } from '@/lib/store';
import { notify } from '@/lib/notify';
import { roundToStep } from '@/lib/quantity';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusPill from '@/components/StatusPill';
import Modal from '@/components/Modal';
import SortSelect from '@/components/SortSelect';

export default function SupplierOrders() {
  const store = useStore();
  const { session } = useSession();
  const uid = session.userId;
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [modal, setModal] = useState(null);
  const [qty, setQty] = useState({});
  const [extraItems, setExtraItems] = useState([]); // products added during accept/edit that weren't in the original order
  const [addProductId, setAddProductId] = useState('');
  const [reason, setReason] = useState('');
  const [dispatchListOpen, setDispatchListOpen] = useState(false);
  const products = store.filter('products', (p) => p.supplier_user_id === uid);

  const all = store.filter('orders', (o) => o.supplier_user_id === uid)
    .sort((a, b) => sort === 'oldest' ? new Date(a.created_date) - new Date(b.created_date) : new Date(b.created_date) - new Date(a.created_date));
  const orders = filter === 'all' ? all : all.filter((o) => o.slot === filter);
  const newCount = orders.filter((o) => o.status === 'placed').length;

  const acceptedInView = orders.filter((o) => o.status === 'accepted');
  const dispatchedInView = orders.filter((o) => o.status === 'dispatched');

  const openAccept = (order, type) => {
    const q = {};
    order.items.forEach((it) => { q[it.product_id || it.name] = it.quantity; });
    setQty(q);
    setExtraItems([]);
    setAddProductId('');
    setModal({ type, order });
  };
  const openReject = (order) => { setReason(''); setModal({ type: 'reject', order }); };
  const openCancel = (order) => { setReason(''); setModal({ type: 'cancel', order }); };

  const confirmAccept = () => {
    const order = modal.order;
    const existing = order.items.map((it) => ({ ...it, quantity: roundToStep(qty[it.product_id || it.name] ?? 0) }));
    const added = extraItems.filter((it) => it.quantity > 0);
    const items = [...existing, ...added];
    const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const isFirstAccept = order.status === 'placed';
    const adjusted = isFirstAccept && (added.length > 0 || existing.some((it, i) => it.quantity !== order.items[i].quantity));
    const isPostAcceptEdit = !isFirstAccept;
    const patch = {
      status: isFirstAccept ? 'accepted' : order.status,
      items, total,
      adjusted_flag: order.adjusted_flag || adjusted,
      edited_flag: order.edited_flag || isPostAcceptEdit,
      edit_requested: false,
      edit_request_note: null,
    };
    store.update('orders', order.id, patch);

    if (order.bill_id) {
      store.update('bills', order.bill_id, { total, edited_flag: true });
    }

    const msg = isPostAcceptEdit
      ? `Your order was edited by the supplier${order.bill_id ? ' (bill updated)' : ''}.`
      : `Your order was accepted${adjusted ? ' (quantities adjusted)' : ''}.`;
    notify(order.customer_user_id, isPostAcceptEdit ? 'order_edited' : 'order_accepted', msg, '/customer/orders');
    setModal(null);
  };

  const confirmReject = () => {
    const order = modal.order;
    store.update('orders', order.id, { status: 'rejected', rejection_reason: reason.trim() || 'Rejected by supplier' });
    notify(order.customer_user_id, 'order_rejected', `Your order was rejected${reason.trim() ? ': ' + reason.trim() : ''}.`, '/customer/orders');
    setModal(null);
  };

  const confirmCancel = () => {
    const order = modal.order;
    store.update('orders', order.id, { status: 'cancelled', cancelled_by: 'supplier', cancel_reason: reason.trim() || null });
    notify(order.customer_user_id, 'order_cancelled', `Your order was cancelled by the supplier${reason.trim() ? ': ' + reason.trim() : ''}.`, '/customer/orders');
    setModal(null);
  };

  const dispatch = (order) => {
    store.update('orders', order.id, { status: 'dispatched' });
    notify(order.customer_user_id, 'order_dispatched', `Your order has been dispatched (${order.slot} round).`, '/customer/orders');
  };
  const generateBill = (order) => {
    const bill = store.create('bills', { order_id: order.id, supplier_user_id: uid, customer_user_id: order.customer_user_id, customer_name: order.customer_name, total: order.total, paid_amount: 0, status: 'unpaid', payments: [], edited_flag: false });
    store.update('orders', order.id, { status: 'billed', bill_id: bill.id });
    notify(order.customer_user_id, 'order_billed', `A bill of ${inr(order.total)} has been generated.`, '/customer/bills');
  };

  const dispatchAll = () => {
    acceptedInView.forEach((o) => {
      store.update('orders', o.id, { status: 'dispatched' });
      notify(o.customer_user_id, 'order_dispatched', `Your order has been dispatched (${o.slot} round).`, '/customer/orders');
    });
  };
  const billAll = () => {
    dispatchedInView.forEach((o) => {
      const bill = store.create('bills', { order_id: o.id, supplier_user_id: uid, customer_user_id: o.customer_user_id, customer_name: o.customer_name, total: o.total, paid_amount: 0, status: 'unpaid', payments: [], edited_flag: false });
      store.update('orders', o.id, { status: 'billed', bill_id: bill.id });
      notify(o.customer_user_id, 'order_billed', `A bill of ${inr(o.total)} has been generated.`, '/customer/bills');
    });
  };

  const dispatchAgg = useMemo(() => {
    const map = new Map();
    acceptedInView.forEach((o) => {
      o.items.forEach((it) => {
        const key = `${it.name}__${it.unit || ''}`;
        const cur = map.get(key) || { name: it.name, unit: it.unit, quantity: 0 };
        cur.quantity += Number(it.quantity) || 0;
        map.set(key, cur);
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [acceptedInView]);

  return (
    <div className="space-y-5">
      <PageHeader title="Orders" sub={`${newCount} new order${newCount === 1 ? '' : 's'} need your attention.`} />
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'AM', 'PM'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors ${filter === f ? 'bg-jet text-surface' : 'bg-surface border border-mist text-ink2 hover:text-ink'}`}>
              {f === 'all' ? 'All rounds' : `${f} round`}
            </button>
          ))}
          <SortSelect value={sort} onChange={setSort} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }]} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDispatchListOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-mist text-ink hover:bg-canvas transition-colors">
            <Boxes size={14} /> Dispatch list
          </button>
          {acceptedInView.length > 0 && (
            <button onClick={dispatchAll} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-jet text-surface hover:bg-ink transition-colors">
              <Zap size={14} /> Dispatch all ({acceptedInView.length})
            </button>
          )}
          {dispatchedInView.length > 0 && (
            <button onClick={billAll} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-jet text-surface hover:bg-ink transition-colors">
              <ScrollText size={14} /> Generate all bills ({dispatchedInView.length})
            </button>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders here" hint="Orders placed by your retailers will show up in real time." />
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => (
            <OrderCard key={o.id} o={o}
              onAccept={() => openAccept(o, 'accept')}
              onEdit={() => openAccept(o, 'edit')}
              onReject={() => openReject(o)}
              onCancel={() => openCancel(o)}
              onDispatch={() => dispatch(o)}
              onBill={() => generateBill(o)}
            />
          ))}
        </div>
      )}

      <Modal open={modal && (modal.type === 'accept' || modal.type === 'edit')} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit order' : 'Accept order'}
        footer={<><button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl border border-mist text-ink font-medium text-sm">Cancel</button><button onClick={confirmAccept} className="px-4 py-2.5 rounded-xl bg-jet text-surface font-medium text-sm inline-flex items-center gap-1.5"><Check size={15} /> Confirm</button></>}>
        {modal && (() => {
          const o = modal.order;
          const liveItems = o.items.map((it) => ({ ...it, quantity: roundToStep(qty[it.product_id || it.name] ?? 0) }));
          const addedTotal = extraItems.reduce((s, it) => s + it.price * (it.quantity || 0), 0);
          const liveTotal = liveItems.reduce((s, it) => s + it.price * it.quantity, 0) + addedTotal;
          const existingIds = new Set(o.items.map((it) => it.product_id).filter(Boolean));
          const extraIds = new Set(extraItems.map((it) => it.product_id));
          const availableToAdd = products.filter((p) => !existingIds.has(p.id) && !extraIds.has(p.id));
          const addProduct = () => {
            const p = products.find((pr) => pr.id === addProductId);
            if (!p) return;
            setExtraItems((cur) => [...cur, { product_id: p.id, name: p.name, unit: p.unit, price: p.price, quantity: 1 }]);
            setAddProductId('');
          };
          const setExtraQty = (id, val) => {
            setExtraItems((cur) => cur.map((it) => it.product_id === id ? { ...it, quantity: roundToStep(val) } : it));
          };
          const removeExtra = (id) => setExtraItems((cur) => cur.filter((it) => it.product_id !== id));
          return (
            <div className="space-y-3">
              <p className="text-sm text-ink2">{o.customer_name} · {o.slot} round</p>
              {o.edit_requested && o.edit_request_note && (
                <p className="text-xs bg-warn/10 text-warn rounded-lg px-3 py-2">Retailer’s note: {o.edit_request_note}</p>
              )}
              {o.status !== 'placed' && (
                <p className="text-xs bg-canvas text-ink2 rounded-lg px-3 py-2">
                  This order is already <span className="font-medium">{o.status}</span>. Saving here updates quantities, price{o.bill_id ? ' and the existing bill' : ''} everywhere.
                </p>
              )}
              {o.items.map((it, i) => {
                const key = it.product_id || it.name;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-ink">{it.name} <span className="text-ink2">· {it.unit} · {inr(it.price)}</span></span>
                    <input type="number" min="0" step="0.5" value={qty[key] ?? 0} onChange={(e) => setQty((q) => ({ ...q, [key]: e.target.value }))} className="w-20 border border-mist rounded-lg px-2 py-2 text-ink font-mono text-sm outline-none focus:border-ink" />
                  </div>
                );
              })}
              {extraItems.map((it) => (
                <div key={it.product_id} className="flex items-center gap-2 bg-ok/5 -mx-1 px-1 rounded-lg">
                  <span className="flex-1 text-sm text-ink">{it.name} <span className="text-ink2">· {it.unit} · {inr(it.price)}</span> <span className="text-[10px] text-ok font-medium">added</span></span>
                  <input type="number" min="0" step="0.5" value={it.quantity} onChange={(e) => setExtraQty(it.product_id, e.target.value)} className="w-20 border border-mist rounded-lg px-2 py-2 text-ink font-mono text-sm outline-none focus:border-ink" />
                  <button onClick={() => removeExtra(it.product_id)} className="text-ink2 hover:text-alert p-1"><X size={14} /></button>
                </div>
              ))}
              {availableToAdd.length > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t border-mist/60">
                  <select value={addProductId} onChange={(e) => setAddProductId(e.target.value)} className="flex-1 border border-mist rounded-lg px-2.5 py-2 text-sm text-ink bg-surface outline-none focus:border-ink">
                    <option value="">+ Add a product to this order...</option>
                    {availableToAdd.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.unit} · {inr(p.price)}</option>)}
                  </select>
                  <button onClick={addProduct} disabled={!addProductId} className="text-xs font-medium px-3 py-2 rounded-lg bg-jet text-surface disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-mist/60"><span className="text-ink2">New total</span><span className="font-mono font-semibold text-ink">{inr(liveTotal)}</span></div>
            </div>
          );
        })()}
      </Modal>

      <Modal open={modal && modal.type === 'reject'} onClose={() => setModal(null)} title="Reject order"
        footer={<><button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl border border-mist text-ink font-medium text-sm">Cancel</button><button onClick={confirmReject} className="px-4 py-2.5 rounded-xl bg-alert text-surface font-medium text-sm">Reject</button></>}>
        <p className="text-sm text-ink2 mb-3">The retailer will be notified with this reason.</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason for rejection (optional)" className="w-full rounded-xl border border-mist bg-surface px-3.5 py-3 text-ink outline-none focus:border-ink" />
      </Modal>

      <Modal open={modal && modal.type === 'cancel'} onClose={() => setModal(null)} title="Cancel order"
        footer={<><button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl border border-mist text-ink font-medium text-sm">Back</button><button onClick={confirmCancel} className="px-4 py-2.5 rounded-xl bg-alert text-surface font-medium text-sm">Cancel order</button></>}>
        <p className="text-sm text-ink2 mb-3">The retailer will be notified that this order was cancelled.</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason (optional)" className="w-full rounded-xl border border-mist bg-surface px-3.5 py-3 text-ink outline-none focus:border-ink" />
      </Modal>

      <Modal open={dispatchListOpen} onClose={() => setDispatchListOpen(false)} title="Dispatch list" size="lg">
        <p className="text-sm text-ink2 mb-3">Total quantity to load for all accepted orders{filter !== 'all' ? ` · ${filter} round` : ''}.</p>
        {dispatchAgg.length === 0 ? (
          <p className="text-sm text-ink2 py-6 text-center">Nothing accepted yet in this view.</p>
        ) : (
          <div className="rounded-xl border border-mist divide-y divide-mist/60">
            {dispatchAgg.map((it) => (
              <div key={it.name + it.unit} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm text-ink">{it.name} <span className="text-ink2">· {it.unit}</span></span>
                <span className="font-mono font-semibold text-ink">{it.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function OrderCard({ o, onAccept, onEdit, onReject, onCancel, onDispatch, onBill }) {
  const time = new Date(o.created_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const cancellable = ['placed', 'accepted', 'dispatched'].includes(o.status);
  return (
    <div className={`rounded-2xl border bg-surface p-4 ${o.status === 'placed' ? 'border-warn/40 ring-1 ring-warn/20' : o.edit_requested ? 'border-warn/40' : 'border-mist'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${o.slot === 'AM' ? 'bg-mist text-ink2' : 'bg-jet text-surface'}`}>{o.slot}</span>
          <span className="font-medium text-ink truncate">{o.customer_name}</span>
          {o.adjusted_flag && <span className="text-[10px] text-warn font-medium bg-warn/10 px-1.5 py-0.5 rounded">adjusted</span>}
          {o.edited_flag && <span className="text-[10px] text-warn font-medium bg-warn/10 px-1.5 py-0.5 rounded">edited</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-ink2 font-mono hidden sm:inline">{time}</span>
          <StatusPill status={o.status} size="xs" />
        </div>
      </div>
      {o.edit_requested && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-warn bg-warn/10 rounded-lg px-2.5 py-1.5">
          <MessageSquareWarning size={13} /> Retailer requested an edit{o.edit_request_note ? `: ${o.edit_request_note}` : ''}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {o.items.map((it, i) => (
          <span key={i} className="text-xs bg-canvas text-ink2 rounded-lg px-2 py-1">{it.name} × {it.quantity}{it.unit ? ` ${it.unit}` : ''}</span>
        ))}
      </div>
      {o.rejection_reason && <p className="mt-2 text-xs text-alert">Reason: {o.rejection_reason}</p>}
      {o.status === 'cancelled' && <p className="mt-2 text-xs text-ink2">Cancelled by {o.cancelled_by || 'someone'}{o.cancel_reason ? `: ${o.cancel_reason}` : ''}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="font-mono font-semibold text-ink">{inr(o.total)}</span>
        <Actions o={o} cancellable={cancellable} onAccept={onAccept} onEdit={onEdit} onReject={onReject} onCancel={onCancel} onDispatch={onDispatch} onBill={onBill} />
      </div>
    </div>
  );
}

function Actions({ o, cancellable, onAccept, onEdit, onReject, onCancel, onDispatch, onBill }) {
  const status = o.status;
  const Ink = ({ onClick, children, icon: Icon }) => (
    <button onClick={onClick} className="text-xs font-medium px-3 py-2 rounded-lg bg-jet text-surface hover:bg-ink inline-flex items-center gap-1.5 transition-colors whitespace-nowrap">{Icon && <Icon size={13} />} {children}</button>
  );
  const Ghost = ({ onClick, children, icon: Icon }) => (
    <button onClick={onClick} className="text-xs font-medium px-3 py-2 rounded-lg border border-mist text-ink hover:bg-canvas inline-flex items-center gap-1.5 transition-colors whitespace-nowrap">{Icon && <Icon size={13} />} {children}</button>
  );
  const Danger = ({ onClick, children }) => (
    <button onClick={onClick} className="text-xs font-medium px-3 py-2 rounded-lg bg-alert/10 text-alert hover:bg-alert/20 transition-colors whitespace-nowrap">{children}</button>
  );
  return (
    <div className="flex gap-2 flex-wrap justify-end">
      {status === 'placed' && <><Ink onClick={onAccept} icon={Check}>Accept</Ink><Danger onClick={onReject}>Reject</Danger></>}
      {status === 'accepted' && <><Ghost onClick={onEdit} icon={Pencil}>Edit</Ghost><Ink onClick={onDispatch} icon={Truck}>Dispatch</Ink></>}
      {status === 'dispatched' && <><Ghost onClick={onEdit} icon={Pencil}>Edit</Ghost><Ink onClick={onBill} icon={ScrollText}>Generate bill</Ink></>}
      {status === 'billed' && <><Ghost onClick={onEdit} icon={Pencil}>Edit (updates bill)</Ghost><span className="text-xs text-ink2 self-center">Billed</span></>}
      {(status === 'rejected' || status === 'cancelled') && <span className="text-xs text-ink2 self-center">Closed</span>}
      {cancellable && <button onClick={onCancel} className="text-xs font-medium px-3 py-2 rounded-lg text-ink2 hover:text-alert hover:bg-alert/10 transition-colors whitespace-nowrap inline-flex items-center gap-1"><X size={13} /> Cancel</button>}
    </div>
  );
}
