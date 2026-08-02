import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, ShoppingCart, CheckCircle2, XCircle, Ban, Truck, ScrollText,
  Pencil, MessageSquareWarning, BellRing, IndianRupee, MessageCircle,
  UserPlus, Link2, Info,
} from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';

// Per-type presentation: a short label (so items are instantly scannable),
// an icon, and a color tone. Falls back to a neutral "Update" for any
// type not listed here so new notification types never render broken.
const TYPE_META = {
  order_placed: { label: 'New order', icon: ShoppingCart, tone: 'info' },
  order_accepted: { label: 'Order accepted', icon: CheckCircle2, tone: 'ok' },
  order_rejected: { label: 'Order rejected', icon: XCircle, tone: 'alert' },
  order_cancelled: { label: 'Order cancelled', icon: Ban, tone: 'alert' },
  order_dispatched: { label: 'Dispatched', icon: Truck, tone: 'info' },
  order_billed: { label: 'Bill generated', icon: ScrollText, tone: 'purple' },
  order_edited: { label: 'Order edited', icon: Pencil, tone: 'warn' },
  edit_requested: { label: 'Edit requested', icon: MessageSquareWarning, tone: 'warn' },
  link_update: { label: 'Network update', icon: Link2, tone: 'ink' },
  link_request: { label: 'New retailer', icon: UserPlus, tone: 'ok' },
  order_reminder: { label: 'Order reminder', icon: BellRing, tone: 'warn' },
  order_reminder_self: { label: 'Daily reminder', icon: BellRing, tone: 'ink' },
  payment_reminder: { label: 'Payment reminder', icon: IndianRupee, tone: 'warn' },
  payment_recorded: { label: 'Payment recorded', icon: CheckCircle2, tone: 'ok' },
  supplier_message: { label: 'Message', icon: MessageCircle, tone: 'info' },
  chat_message: { label: 'New message', icon: MessageCircle, tone: 'info' },
};
const DEFAULT_META = { label: 'Update', icon: Info, tone: 'ink' };

const TONE_CLASSES = {
  ok: 'bg-ok/12 text-ok',
  alert: 'bg-alert/12 text-alert',
  warn: 'bg-warn/12 text-warn',
  info: 'bg-blue-500/12 text-blue-600',
  purple: 'bg-purple-500/12 text-purple-600',
  ink: 'bg-canvas text-ink2',
};

function metaFor(type) {
  return TYPE_META[type] || DEFAULT_META;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function NotificationBell() {
  const store = useStore();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const notes = session
    ? store.filter('notifications', (n) => n.user_id === session.userId).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    : [];
  const unread = notes.filter((n) => !n.read).length;

  const markAll = () => notes.forEach((n) => !n.read && store.update('notifications', n.id, { read: true }));
  const markOne = (n) => { if (!n.read) store.update('notifications', n.id, { read: true }); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative w-10 h-10 rounded-xl border border-mist bg-surface grid place-items-center text-ink hover:bg-canvas transition-colors">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-alert text-surface text-[10px] font-bold grid place-items-center">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[92vw] bg-surface rounded-2xl shadow-2xl border border-mist overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-mist bg-canvas/30">
            <div className="flex items-center gap-2">
              <p className="font-display font-semibold text-ink text-sm">Notifications</p>
              {unread > 0 && <span className="text-[10px] font-bold bg-alert text-surface rounded-full px-1.5 py-0.5 leading-none">{unread} new</span>}
            </div>
            {unread > 0 && <button onClick={markAll} className="text-xs font-medium text-ink2 hover:text-ink">Mark all read</button>}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-mist/60">
            {notes.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={22} className="mx-auto text-ink2/50 mb-2" />
                <p className="text-sm text-ink2">You’re all caught up.</p>
              </div>
            ) : notes.map((n) => {
              const { label, icon: Icon, tone } = metaFor(n.type);
              const body = (
                <div className={`flex gap-3 px-4 py-3 transition-colors hover:bg-canvas/50 ${n.read ? '' : 'bg-blue-500/[0.04]'}`}>
                  <span className={`shrink-0 w-9 h-9 rounded-full grid place-items-center ${TONE_CLASSES[tone]}`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-ink uppercase tracking-wide">{label}</p>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0" />}
                    </div>
                    <p className="mt-0.5 text-sm text-ink2 leading-snug">{n.text}</p>
                    <p className="mt-1 text-[11px] text-ink2/70 font-mono">{timeAgo(n.created_date)}</p>
                  </div>
                </div>
              );
              return (
                <div key={n.id} onClick={() => markOne(n)}>
                  {n.link
                    ? <Link to={n.link} className="block" onClick={() => setOpen(false)}>{body}</Link>
                    : body}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}