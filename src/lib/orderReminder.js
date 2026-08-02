import { store } from '@/lib/store';
import { notify } from '@/lib/notify';

// Reminder settings live directly on the customer's profile record:
//   order_reminder_enabled: boolean
//   order_reminder_time: "HH:MM" (24h, local time)
//   order_reminder_last_fired: "YYYY-MM-DD" (last date it fired, to avoid repeats)

export function getReminderSettings(profile) {
  return {
    enabled: !!profile?.order_reminder_enabled,
    time: profile?.order_reminder_time || '09:00',
  };
}

export function setReminderSettings(profileId, { enabled, time }) {
  return store.update('customer_profiles', profileId, {
    order_reminder_enabled: enabled,
    order_reminder_time: time,
  });
}

function todayStr(d = new Date()) {
  // Local calendar date (not UTC) — matches nowHHMM()'s use of local hours,
  // so the "already fired today" check can't drift a day off near midnight
  // in timezones ahead of UTC (e.g. IST).
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowHHMM(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Called periodically (e.g. every 30s) while a customer is logged in.
// Fires at most once per day, at-or-after the saved time.
export function checkAndFireReminder(profile, userId) {
  if (!profile?.order_reminder_enabled || !profile?.order_reminder_time) return false;
  const today = todayStr();
  if (profile.order_reminder_last_fired === today) return false;
  if (nowHHMM() < profile.order_reminder_time) return false;

  notify(userId, 'order_reminder_self', "Reminder: don't forget to place today's order.", '/customer/new-order');
  store.update('customer_profiles', profile.id, { order_reminder_last_fired: today });
  return true;
}
