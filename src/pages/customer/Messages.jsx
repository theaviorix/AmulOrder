import React, { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { useSession } from '@/lib/AppSession';
import { threadMessages, sendMessage, markThreadRead } from '@/lib/chat';
import Avatar from '@/components/Avatar';
import ChatThread from '@/components/ChatThread';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';

export default function CustomerMessages() {
  const store = useStore();
  const { session } = useSession();
  const supUid = session.supplierUserId;
  const myProfile = session.profileId ? store.get('customer_profiles', session.profileId) : null;
  const supplierProfile = supUid ? store.find('supplier_profiles', (s) => s.user_id === supUid) : null;

  const messages = supUid ? threadMessages(supUid, session.userId) : [];

  useEffect(() => {
    if (supUid) markThreadRead(supUid, session.userId, 'customer');
  }, [supUid, session.userId, messages.length]);

  if (!supUid || !supplierProfile) {
    return (
      <div className="space-y-5">
        <PageHeader title="Messages" sub="Chat directly with your supplier." />
        <EmptyState icon={MessageCircle} title="Not linked to a supplier yet" hint="Connect with your supplier using their invite code to start chatting." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" sub="Chat directly with your supplier." />
      <div className="rounded-2xl border border-mist bg-surface overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[420px]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-mist shrink-0">
          <Avatar src={supplierProfile.avatar} name={supplierProfile.business_name} size="sm" />
          <p className="font-medium text-ink text-sm">{supplierProfile.business_name}</p>
        </div>
        <ChatThread
          messages={messages}
          mine="customer"
          onSend={(text) => sendMessage({ supplierUserId: supUid, customerUserId: session.userId, sender: 'customer', senderName: myProfile?.shop_name, text })}
        />
      </div>
    </div>
  );
}
