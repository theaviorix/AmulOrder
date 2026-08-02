import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, X, MessageSquarePlus } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { inr } from '@/lib/store';
import { notify } from '@/lib/notify';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusPill from '@/components/StatusPill';
import Modal from '@/components/Modal';
import SortSelect from '@/components/SortSelect';

const FLOW = ['placed', 'accepted', 'dispatched', 'billed'];

export default function CustomerOrders() {
  const store = useStore();
  const { session } = useSession();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const all = store.filter('orders', (o) => o.customer_user_id === session.userId)
    .sort((a, b) => sort === 'oldest' ? new Date(a.created_date) - new Date(b.created_date) : new Date(b.created_date) - new Date(a.created_date));
  const orders = filter === 'all' ? all : all.filter((o) => o.slot === filter);

  const [modal, setModal] = useState(null); // { type: 'cancel' | 'editRequest', order }
  const [note, setNote] = useState('');

  const openCancel = (o) => { setNote(''); setModal({ type: 'cancel', order: o }); };
  const openEditRequest = (o) => { setNote(''); setModal({ type: 'editRequest', order: o }); };

  const confirmCancel = () => {
    const o = modal.order;
    store.update('orders', o.id, { status: 'cancelled', cancelled_by: 'customer', cancel_reason: note.trim() || null });
    notify(o.supplier_user_id, 'order_cancelled', `${o.customer_name} cancelled their order${note.trim() ? ': ' + note.trim() : ''}.`, '/supplier/orders');
    setModal(null);
  };

  const confirmEditRequest = () => {
    const o = modal.order;
    if (!note.trim()) return;
    store.update('orders', o.id, { edit_requested: true, edit_request_note: note.trim() });
    notify(o.supplier_user_id, 'edit_requested', `${o.customer_name} requested a change to their order: ${note.trim()}`, '/supplier/orders');
    setModal(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="My orders" sub="Track every order from placed to billed." />
      <div className="flex flex-wrap items-center gap-1.5 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {['all', 'AM', 'PM'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors ${filter === f ? 'bg-jet text-surface' : 'bg-surface border border-mist text-ink2 hover:text-ink'}`}>
              {f === 'all' ? 'All rounds' : `${f} round`}
            </button>
          ))}
        </div>
        <SortSelect value={sort} onChange={setSort} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }]} />
      </div>
      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" hint="Your placed orders and their status will show up here." action={<Link to="/customer/new-order" className="text-sm font-medium bg-jet text-surface px-4 py-2 rounded-lg">Place an order</Link>} />
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => <OrderTimeline key={o.id} o={o} onCancel={() => openCancel(o)} onRequestEdit={() => openEditRequest(o)} />)}
        </div>
      )}

      <Modal open={modal?.type === 'cancel'} onClose={() => setModal(null)} title="Cancel order"
        footer={<><button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl border border-mist text-ink font-medium text-sm">Back</button><button onClick={confirmCancel} className="px-4 py-2.5 rounded-xl bg-alert text-surface font-medium text-sm">Cancel order</button></>}>
        <p className="text-sm text-ink2 mb-3">Your supplier will be notified that this order was cancelled.</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Reason (optional)" className="w-full rounded-xl border border-mist bg-surface px-3.5 py-3 text-ink outline-none focus:border-ink" />
      </Modal>

      <Modal open={modal?.type === 'editRequest'} onClose={() => setModal(null)} title="Request an edit"
        footer={<><button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl border border-mist text-ink font-medium text-sm">Cancel</button><button onClick={confirmEditRequest} disabled={!note.trim()} className="px-4 py-2.5 rounded-xl bg-jet text-surface font-medium text-sm disabled:opacity-50">Send request</button></>}>
        <p className="text-sm text-ink2 mb-3">Tell your supplier what needs to change — they’ll edit the order and it’ll be marked “edited”.</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Please change milk to 10 units instead of 6" className="w-full rounded-xl border border-mist bg-surface px-3.5 py-3 text-ink outline-none focus:border-ink" autoFocus />
      </Modal>
    </div>
  );
}

function OrderTimeline({ o, onCancel, onRequestEdit }) {
  const rejected = o.status === 'rejected';
  const cancelled = o.status === 'cancelled';
  const closed = rejected || cancelled;
  const idx = FLOW.indexOf(o.status);
  const cancellable = ['placed', 'accepted', 'dispatched'].includes(o.status);
  const canRequestEdit = ['placed', 'accepted', 'dispatched'].includes(o.status);
  return (
    <div className="rounded-2xl border border-mist bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${o.slot === 'AM' ? 'bg-mist text-ink2' : 'bg-jet text-surface'}`}>{o.slot}</span>
          <span className="text-[11px] text-ink2 font-mono">{new Date(o.created_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          {o.edited_flag && <span className="text-[10px] text-warn font-medium bg-warn/10 px-1.5 py-0.5 rounded">edited</span>}
        </div>
        <StatusPill status={o.status} size="xs" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {o.items.map((it, i) => <span key={i} className="text-xs bg-canvas text-ink2 rounded-lg px-2 py-1">{it.name} × {it.quantity}</span>)}
      </div>
      {o.adjusted_flag && <p className="mt-2 text-xs text-warn">Quantities were adjusted by the supplier.</p>}
      {o.edit_requested && <p className="mt-2 text-xs text-warn">Edit request sent — waiting on your supplier.</p>}
      {rejected && <p className="mt-2 text-xs text-alert">Rejected — {o.rejection_reason || 'no reason provided'}</p>}
      {cancelled && <p className="mt-2 text-xs text-ink2">Cancelled by {o.cancelled_by === 'customer' ? 'you' : 'supplier'}{o.cancel_reason ? `: ${o.cancel_reason}` : ''}</p>}
      {!closed && (
        <div className="mt-4 flex items-center">
          {FLOW.map((s, i) => (
            <React.Fragment key={s}>
              <Step done={i <= idx} active={i === idx} label={s[0].toUpperCase() + s.slice(1)} />
              {i < FLOW.length - 1 && <span className={`flex-1 h-0.5 mx-1 ${i < idx ? 'bg-ok' : 'bg-mist'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-mist/60 flex justify-between items-center">
        <span className="text-xs text-ink2">Total</span>
        <span className="font-mono font-semibold text-ink">{inr(o.total)}</span>
      </div>
      {(cancellable || canRequestEdit) && (
        <div className="mt-3 flex gap-2 justify-end">
          {canRequestEdit && !o.edit_requested && (
            <button onClick={onRequestEdit} className="text-xs font-medium px-3 py-2 rounded-lg border border-mist text-ink hover:bg-canvas inline-flex items-center gap-1.5"><MessageSquarePlus size={13} /> Request edit</button>
          )}
          {cancellable && (
            <button onClick={onCancel} className="text-xs font-medium px-3 py-2 rounded-lg text-ink2 hover:text-alert hover:bg-alert/10 inline-flex items-center gap-1"><X size={13} /> Cancel</button>
          )}
        </div>
      )}
    </div>
  );
}

function Step({ done, active, label }) {
  return (
    <div className="flex flex-col items-center gap-1 w-12">
      <span className={`w-3 h-3 rounded-full ${done ? 'bg-ok' : 'bg-mist'} ${active ? 'ring-2 ring-ok/30' : ''}`} />
      <span className={`text-[10px] ${done ? 'text-ink' : 'text-ink2'}`}>{label}</span>
    </div>
  );
}
