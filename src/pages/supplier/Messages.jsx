import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { threadMessages, sendMessage, markThreadRead, unreadCountForSupplier } from '@/lib/chat';
import Avatar from '@/components/Avatar';
import ChatThread from '@/components/ChatThread';
import EmptyState from '@/components/EmptyState';
import SearchInput from '@/components/SearchInput';

export default function SupplierMessages() {
  const store = useStore();
  const { session } = useSession();
  const uid = session.userId;
  const profile = session.profileId ? store.get('supplier_profiles', session.profileId) : null;
  const links = store.filter('supplier_links', (l) => l.supplier_user_id === uid && l.status === 'active');

  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState(null);

  const rows = useMemo(() => {
    return links.map((l) => {
      const msgs = threadMessages(uid, l.customer_user_id);
      const last = msgs[msgs.length - 1];
      const unread = unreadCountForSupplier(uid, l.customer_user_id);
      const cprofile = store.get('customer_profiles', l.customer_profile_id);
      return { link: l, last, unread, avatar: cprofile?.avatar };
    }).sort((a, b) => {
      const at = a.last ? new Date(a.last.created_date).getTime() : 0;
      const bt = b.last ? new Date(b.last.created_date).getTime() : 0;
      return bt - at;
    });
  }, [links, uid, store]);

  const filtered = q.trim() ? rows.filter((r) => r.link.customer_name.toLowerCase().includes(q.trim().toLowerCase())) : rows;
  const activeRow = rows.find((r) => r.link.id === activeId);

  useEffect(() => {
    if (activeRow) markThreadRead(uid, activeRow.link.customer_user_id, 'supplier');
  }, [activeId, activeRow?.last?.id]);

  if (links.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="font-display font-bold text-ink text-2xl tracking-tight">Messages</h1>
        <EmptyState icon={MessageCircle} title="No conversations yet" hint="Once retailers join your network, you can chat with them here." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display font-bold text-ink text-2xl tracking-tight">Messages</h1>
      <div className="rounded-2xl border border-mist bg-surface overflow-hidden grid md:grid-cols-[300px_1fr] h-[calc(100vh-220px)] min-h-[420px]">
        <div className={`border-r border-mist flex-col ${activeId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-mist"><SearchInput value={q} onChange={setQ} placeholder="Search chats..." /></div>
          <div className="flex-1 overflow-y-auto divide-y divide-mist/50">
            {filtered.length === 0 ? (
              <p className="text-sm text-ink2 text-center py-8">No matches.</p>
            ) : filtered.map((r) => (
              <button
                key={r.link.id}
                onClick={() => setActiveId(r.link.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-canvas transition-colors ${activeId === r.link.id ? 'bg-canvas' : ''}`}
              >
                <Avatar src={r.avatar} name={r.link.customer_name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink truncate">{r.link.customer_name}</p>
                    {r.last && <span className="text-[10px] text-ink2 font-mono shrink-0">{new Date(r.last.created_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <p className="text-xs text-ink2 truncate">{r.last ? r.last.text : 'No messages yet'}</p>
                </div>
                {r.unread > 0 && <span className="w-5 h-5 rounded-full bg-ok text-surface text-[10px] font-bold grid place-items-center shrink-0">{r.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className={`flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}>
          {activeRow ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-mist shrink-0">
                <button onClick={() => setActiveId(null)} className="md:hidden text-ink2 hover:text-ink p-1 -ml-1"><ArrowLeft size={18} /></button>
                <Avatar src={activeRow.avatar} name={activeRow.link.customer_name} size="sm" />
                <p className="font-medium text-ink text-sm">{activeRow.link.customer_name}</p>
              </div>
              <ChatThread
                messages={threadMessages(uid, activeRow.link.customer_user_id)}
                mine="supplier"
                onSend={(text) => sendMessage({ supplierUserId: uid, customerUserId: activeRow.link.customer_user_id, sender: 'supplier', senderName: profile?.business_name, text })}
              />
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-ink2 text-sm">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}
