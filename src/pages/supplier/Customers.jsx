import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Copy, Check, Share2, Bell, PackageX, IndianRupee, Send, BellRing, ScrollText } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { inr } from '@/lib/store';
import { notify } from '@/lib/notify';
import { ensureInviteCode } from '@/lib/inviteCode';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusPill from '@/components/StatusPill';
import Modal from '@/components/Modal';
import SearchInput from '@/components/SearchInput';
import Avatar from '@/components/Avatar';

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function SupplierCustomers() {
  const store = useStore();
  const { session } = useSession();
  const uid = session.userId;
  const [inviteCodeError, setInviteCodeError] = useState(false);
  const [retryTick, setRetryTick] = useState(0); // bump to retry invite-code generation

  const profile = session.profileId ? store.get('supplier_profiles', session.profileId) : null;

  // Self-heal a supplier profile that's missing its invite code (e.g. an
  // older row, or one created before invite codes existed).
  useEffect(() => {
    if (!profile || profile.invite_code) { setInviteCodeError(false); return; }
    let active = true;
    (async () => {
      const healed = await ensureInviteCode(profile);
      if (active) setInviteCodeError(!healed?.invite_code);
    })();
    return () => { active = false; };
  }, [profile, retryTick]);

  const links = store.filter('supplier_links', (l) => l.supplier_user_id === uid);
  const pending = links.filter((l) => l.status === 'pending');
  const activeAll = links.filter((l) => l.status === 'active');
  const bills = store.filter('bills', (b) => b.supplier_user_id === uid);
  const orders = store.filter('orders', (o) => o.supplier_user_id === uid);
  const avatarFor = (link) => store.get('customer_profiles', link.customer_profile_id)?.avatar;

  const [q, setQ] = useState('');
  const active = q.trim() ? activeAll.filter((l) => l.customer_name.toLowerCase().includes(q.trim().toLowerCase())) : activeAll;

  const orderedTodayIds = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => { if (isToday(o.created_date) && o.status !== 'cancelled') set.add(o.customer_user_id); });
    return set;
  }, [orders]);

  const orderedToday = active.filter((l) => orderedTodayIds.has(l.customer_user_id));
  const notOrderedToday = active.filter((l) => !orderedTodayIds.has(l.customer_user_id));

  const balanceOf = (cid) => bills.filter((b) => b.customer_user_id === cid && b.status !== 'paid').reduce((s, b) => s + (b.total - b.paid_amount), 0);
  const setLink = async (l, status) => {
    const updated = store.update('supplier_links', l.id, { status });
    if (updated) {
      notify(l.customer_user_id, 'link_update', `Your supplier ${status === 'active' ? 'approved' : 'blocked'} your link.`, '/customer/new-order');
    }
  };

  const [nudge, setNudge] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [bulkSent, setBulkSent] = useState(false);

  const sendNudge = (type) => {
    if (!nudge) return;
    const businessName = profile?.business_name || 'Your supplier';
    if (type === 'missing_order') {
      notify(nudge.customer_user_id, 'order_reminder', `${businessName}: we haven't received your order yet — place one when you're ready.`, '/customer/new-order');
    } else if (type === 'payment') {
      const due = balanceOf(nudge.customer_user_id);
      notify(nudge.customer_user_id, 'payment_reminder', `${businessName}: friendly reminder, you have ${inr(due)} outstanding.`, '/customer/bills');
    } else if (type === 'custom' && customMsg.trim()) {
      notify(nudge.customer_user_id, 'supplier_message', `${businessName}: ${customMsg.trim()}`, '/customer/new-order');
    }
    setSent(true);
    setTimeout(() => { setNudge(null); setSent(false); setCustomMsg(''); }, 900);
  };

  const remindAllMissing = () => {
    const businessName = profile?.business_name || 'Your supplier';
    notOrderedToday.forEach((l) => {
      notify(l.customer_user_id, 'order_reminder', `${businessName}: we haven't received your order yet — place one when you're ready.`, '/customer/new-order');
    });
    setBulkSent(true);
    setTimeout(() => setBulkSent(false), 1800);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Customers" sub="Retailers linked to your network and your invite code." action={<SearchInput value={q} onChange={setQ} placeholder="Search customers..." />} />

      <div className="rounded-2xl bg-jet text-surface p-5">
        <p className="text-xs uppercase tracking-widest text-surface/60">Your invite code</p>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p className="font-mono text-3xl font-semibold tracking-wide">
            {profile?.invite_code ? profile.invite_code : inviteCodeError ? 'Unavailable' : profile ? 'Generating…' : '—'}
          </p>
          <div className="flex gap-2">
            <CopyButton text={profile?.invite_code} />
            <ShareButton code={profile?.invite_code} business={profile?.business_name} />
          </div>
        </div>
        {inviteCodeError ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-alert">Couldn’t generate an invite code. Please try again.</p>
            <button onClick={() => setRetryTick((t) => t + 1)} className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface/15 text-surface hover:bg-surface/25 transition-colors">
              Retry
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-surface/60">Share this with your retailers so they can link to your price list.</p>
        )}
      </div>

      {pending.length > 0 && (
        <section>
          <h3 className="font-display font-semibold text-ink mb-2">Pending requests</h3>
          <div className="grid gap-2">
            {pending.map((l) => (
              <div key={l.id} className="rounded-xl border border-warn/40 bg-surface p-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-ink">{l.customer_name}</p><p className="text-xs text-ink2">Wants to join your network</p></div>
                <div className="flex gap-2">
                  <button onClick={() => setLink(l, 'active')} className="text-xs font-medium px-3 py-2 rounded-lg bg-jet text-surface">Approve</button>
                  <button onClick={() => setLink(l, 'blocked')} className="text-xs font-medium px-3 py-2 rounded-lg border border-mist text-ink2">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeAll.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-ink">Haven’t ordered today <span className="text-ink2 font-normal">({notOrderedToday.length})</span></h3>
            {notOrderedToday.length > 0 && (
              <button onClick={remindAllMissing} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-jet text-surface hover:bg-ink transition-colors">
                <BellRing size={13} /> {bulkSent ? 'Sent ✓' : `Remind all (${notOrderedToday.length})`}
              </button>
            )}
          </div>
          {notOrderedToday.length === 0 ? (
            <p className="text-sm text-ink2 py-2">Everyone has ordered today 🎉</p>
          ) : (
            <div className="rounded-2xl border border-mist bg-surface overflow-hidden divide-y divide-mist/50">
              {notOrderedToday.map((l) => (
                <CustomerRow key={l.id} l={l} avatar={avatarFor(l)} balance={balanceOf(l.customer_user_id)} onNudge={() => setNudge(l)} />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h3 className="font-display font-semibold text-ink mb-2">Ordered today <span className="text-ink2 font-normal">({orderedToday.length})</span></h3>
        {active.length === 0 ? (
          <EmptyState icon={Users} title={q.trim() ? 'No matches' : 'No linked retailers yet'} hint={q.trim() ? 'No customers match your search.' : 'Share your invite code to get your first retailer onboard.'} />
        ) : orderedToday.length === 0 ? (
          <p className="text-sm text-ink2 py-2">No orders yet today.</p>
        ) : (
          <div className="rounded-2xl border border-mist bg-surface overflow-hidden divide-y divide-mist/50">
            {orderedToday.map((l) => (
              <CustomerRow key={l.id} l={l} avatar={avatarFor(l)} balance={balanceOf(l.customer_user_id)} onNudge={() => setNudge(l)} />
            ))}
          </div>
        )}
      </section>

      <Modal open={!!nudge} onClose={() => { setNudge(null); setCustomMsg(''); }} title={`Remind ${nudge?.customer_name || ''}`}>
        {sent ? (
          <p className="text-sm text-ok font-medium py-4 text-center">Reminder sent ✓</p>
        ) : (
          <div className="space-y-3">
            <button onClick={() => sendNudge('missing_order')} className="w-full flex items-center gap-3 rounded-xl border border-mist p-3.5 hover:bg-canvas transition-colors text-left">
              <span className="w-9 h-9 rounded-lg bg-warn/15 text-warn grid place-items-center shrink-0"><PackageX size={17} /></span>
              <span>
                <span className="block text-sm font-medium text-ink">Missing order</span>
                <span className="block text-xs text-ink2">Nudge them to place today’s order</span>
              </span>
            </button>
            <button onClick={() => sendNudge('payment')} className="w-full flex items-center gap-3 rounded-xl border border-mist p-3.5 hover:bg-canvas transition-colors text-left">
              <span className="w-9 h-9 rounded-lg bg-alert/15 text-alert grid place-items-center shrink-0"><IndianRupee size={17} /></span>
              <span>
                <span className="block text-sm font-medium text-ink">Payment reminder</span>
                <span className="block text-xs text-ink2">Outstanding: {inr(balanceOf(nudge?.customer_user_id))}</span>
              </span>
            </button>
            <div className="rounded-xl border border-mist p-3.5">
              <span className="block text-sm font-medium text-ink mb-2">Custom message</span>
              <textarea
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Type a message to send..."
                rows={2}
                className="w-full rounded-lg border border-mist bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink resize-none"
              />
              <button
                onClick={() => sendNudge('custom')}
                disabled={!customMsg.trim()}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-lg bg-jet text-surface disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={13} /> Send message
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CustomerRow({ l, avatar, balance, onNudge }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <Link to={`/supplier/customers/${l.id}`} className="flex items-center gap-3 min-w-0 group">
        <Avatar src={avatar} name={l.customer_name} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink truncate group-hover:underline">{l.customer_name}</p>
          <p className="text-xs text-ink2">Outstanding <span className="font-mono text-ink">{inr(balance)}</span></p>
        </div>
      </Link>
      <div className="flex items-center gap-2 shrink-0">
        <Link to={`/supplier/customers/${l.id}`} title="Transaction history" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-mist text-ink2 hover:bg-canvas hover:text-ink transition-colors">
          <ScrollText size={13} /> <span className="hidden sm:inline">History</span>
        </Link>
        <button onClick={onNudge} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-mist text-ink2 hover:bg-canvas hover:text-ink transition-colors">
          <Bell size={13} /> Remind
        </button>
        <StatusPill status={l.status} size="xs" />
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };
  return (
    <button
      onClick={copy}
      disabled={!text}
      className="inline-flex items-center gap-1.5 text-sm font-medium bg-surface text-jet px-4 py-2.5 rounded-xl hover:bg-canvas transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
    >
      {done ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
    </button>
  );
}

function ShareButton({ code, business }) {
  if (!code) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-surface/15 text-surface/40 px-4 py-2.5 rounded-xl cursor-not-allowed">
        <Share2 size={15} /> WhatsApp
      </span>
    );
  }
  const msg = `Hi! Join ${business || 'my'} network on Amul Connect using invite code: ${code}`;
  return (
    <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium bg-surface/15 text-surface px-4 py-2.5 rounded-xl hover:bg-surface/25 transition-colors">
      <Share2 size={15} /> WhatsApp
    </a>
  );
}
