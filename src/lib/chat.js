import { store } from '@/lib/store';
import { notify } from '@/lib/notify';

// A "thread" is uniquely identified by the (supplier_user_id, customer_user_id) pair.

export function threadMessages(supplierUserId, customerUserId) {
  return store
    .filter('messages', (m) => m.supplier_user_id === supplierUserId && m.customer_user_id === customerUserId)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
}

export function sendMessage({ supplierUserId, customerUserId, sender, senderName, text }) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  const msg = store.create('messages', {
    supplier_user_id: supplierUserId,
    customer_user_id: customerUserId,
    sender, // 'supplier' | 'customer'
    sender_name: senderName,
    text: trimmed,
    read_by_supplier: sender === 'supplier',
    read_by_customer: sender === 'customer',
  });
  const targetId = sender === 'supplier' ? customerUserId : supplierUserId;
  const link = sender === 'supplier' ? '/customer/messages' : '/supplier/messages';
  notify(targetId, 'chat_message', `${senderName || 'New message'}: ${trimmed.length > 60 ? trimmed.slice(0, 60) + '…' : trimmed}`, link);
  return msg;
}

export function markThreadRead(supplierUserId, customerUserId, reader) {
  const field = reader === 'supplier' ? 'read_by_supplier' : 'read_by_customer';
  threadMessages(supplierUserId, customerUserId).forEach((m) => {
    if (!m[field]) store.update('messages', m.id, { [field]: true });
  });
}

export function unreadCountForSupplier(supplierUserId, customerUserId) {
  return threadMessages(supplierUserId, customerUserId).filter((m) => m.sender === 'customer' && !m.read_by_supplier).length;
}

export function unreadCountForCustomer(supplierUserId, customerUserId) {
  return threadMessages(supplierUserId, customerUserId).filter((m) => m.sender === 'supplier' && !m.read_by_customer).length;
}
