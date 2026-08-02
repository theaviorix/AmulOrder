import { store } from './store';

export function notify(userId, type, text, link) {
  if (!userId) return null;
  return store.create('notifications', { user_id: userId, type, text, read: false, link });
}