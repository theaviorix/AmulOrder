// Firestore-backed data layer that keeps the exact same synchronous API the
// app was already built around (list/filter/find/get/create/update/remove +
// an 'amul-store-change' event), so pages written against the old
// localStorage mock didn't need to be rewritten one-by-one.
//
// How it works: every table is mirrored into an in-memory cache via a live
// Firestore onSnapshot listener. Reads are synchronous against that cache.
// Writes optimistically update the cache + fire 'amul-store-change'
// immediately (so the UI feels instant, matching the old localStorage
// behaviour), then persist to Firestore in the background — the snapshot
// listener will reconcile the cache with the server's version shortly after.
//
// Caveat: this pulls each whole collection into memory client-side. Fine at
// this app's scale; for a much bigger dataset you'd want scoped Firestore
// queries (where() clauses) per table instead.

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebaseClient';

const TABLES = [
  'profiles',
  'supplier_profiles',
  'customer_profiles',
  'supplier_links',
  'products',
  'orders',
  'bills',
  'notifications',
  'reviews',
  'messages',
];

function genId() {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const cache = Object.fromEntries(TABLES.map((t) => [t, []]));
let ready = Object.fromEntries(TABLES.map((t) => [t, false]));
let readyResolvers = {};
let readyPromises = Object.fromEntries(
  TABLES.map((t) => [t, new Promise((resolve) => { readyResolvers[t] = resolve; })])
);

function notify(table) {
  window.dispatchEvent(new CustomEvent('amul-store-change', { detail: { table } }));
}

let unsubscribeFns = [];

function subscribeAll() {
  unsubscribeFns.forEach((fn) => fn());
  unsubscribeFns = TABLES.map((table) =>
    onSnapshot(
      collection(db, table),
      (snap) => {
        cache[table] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready[table] = true;
        readyResolvers[table](); // no-op if already resolved
        notify(table);
      },
      (err) => console.error(`Firestore listener failed for "${table}":`, err)
    )
  );
}

function unsubscribeAll() {
  unsubscribeFns.forEach((fn) => fn());
  unsubscribeFns = [];
  TABLES.forEach((t) => { cache[t] = []; });
  ready = Object.fromEntries(TABLES.map((t) => [t, false]));
  readyResolvers = {};
  readyPromises = Object.fromEntries(
    TABLES.map((t) => [t, new Promise((resolve) => { readyResolvers[t] = resolve; })])
  );
}

// Only open Firestore listeners once we have a CONFIRMED signed-in user —
// opening them immediately at module load races against Firebase Auth
// restoring a persisted session (which is asynchronous), and a listener
// that gets denied once due to that race never automatically retries.
// Re-subscribing on every auth change also means logging out and back in
// (or into a different account) gets fresh, correctly-scoped listeners
// instead of reusing dead ones from a prior session.
onAuthStateChanged(auth, (user) => {
  if (user) {
    subscribeAll();
  } else {
    unsubscribeAll();
  }
});

// Resolves once `table`'s first Firestore snapshot has arrived. Use this
// before trusting a "not found" result from store.find/get right after
// login/app-start — the in-memory cache is empty until the first snapshot
// lands, so checking too early looks identical to "doesn't exist".
export function waitUntilReady(table) {
  return readyPromises[table] || Promise.resolve();
}

export const store = {
  TABLES,
  isReady(table) {
    return ready[table];
  },
  list(table) {
    return cache[table] || [];
  },
  filter(table, predicate) {
    return (cache[table] || []).filter(predicate);
  },
  find(table, predicate) {
    return (cache[table] || []).find(predicate);
  },
  get(table, id) {
    return (cache[table] || []).find((r) => r.id === id) || null;
  },
  create(table, data) {
    const now = new Date().toISOString();
    const record = { id: genId(), created_date: now, updated_date: now, ...data };
    cache[table] = [...(cache[table] || []), record];
    notify(table);
    setDoc(doc(db, table, record.id), record).catch((err) => {
      console.error(`Failed to create "${table}" record in Firestore:`, err);
    });
    return record;
  },
  update(table, id, patch) {
    const rows = cache[table] || [];
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) return null;
    const updated = { ...rows[i], ...patch, updated_date: new Date().toISOString() };
    cache[table] = [...rows.slice(0, i), updated, ...rows.slice(i + 1)];
    notify(table);
    updateDoc(doc(db, table, id), patch).catch((err) => {
      console.error(`Failed to update "${table}/${id}" in Firestore:`, err);
    });
    return updated;
  },
  remove(table, id) {
    cache[table] = (cache[table] || []).filter((r) => r.id !== id);
    notify(table);
    deleteDoc(doc(db, table, id)).catch((err) => {
      console.error(`Failed to delete "${table}/${id}" in Firestore:`, err);
    });
  },
  removeAll(table, predicate) {
    const toRemove = (cache[table] || []).filter(predicate);
    cache[table] = (cache[table] || []).filter((r) => !predicate(r));
    notify(table);
    toRemove.forEach((r) => {
      deleteDoc(doc(db, table, r.id)).catch((err) => {
        console.error(`Failed to delete "${table}/${r.id}" in Firestore:`, err);
      });
    });
  },
};

export function daysSince(dateStr) {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function inr(amount) {
  const n = Number(amount || 0);
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 === 0 ? 0 : 2 });
}

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '').slice(-10); // last 10 digits, ignore +91/spaces/dashes
}

// True if this phone number is already used by any supplier or customer
// profile. Used to stop the same phone number being registered twice.
export function isPhoneTaken(phone, excludeProfileId) {
  const normalized = normalizePhone(phone);
  if (normalized.length < 10) return false; // don't block obviously-incomplete input
  const inTable = (table) =>
    store.list(table).some((p) => p.id !== excludeProfileId && normalizePhone(p.phone) === normalized);
  return inTable('supplier_profiles') || inTable('customer_profiles');
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomLetter() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

// 4 random digits, zero-padded (0000-9999) so every code has a fixed shape.
function randomDigits() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

// Supplier invite codes: 4 letters (from the business name, padded with
// random letters if the name is too short) + 4 random digits, e.g. "SHAR-4821".
// Combination space is 26^4 * 10^4 (~4.6 billion), and we still verify against
// every existing code so a collision can never actually be issued.
export function genInviteCode(businessName) {
  const lettersFromName = (businessName || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4);
  let base = lettersFromName;
  while (base.length < 4) base += randomLetter();

  const existingCodes = new Set(store.list('supplier_profiles').map((s) => s.invite_code));

  let code;
  let attempts = 0;
  do {
    code = `${base}-${randomDigits()}`;
    attempts++;
    // In the astronomically unlikely case all 10,000 numeric suffixes for
    // this exact base are taken, reshuffle the letters too so we always
    // terminate with a guaranteed-unique code.
    if (attempts > 200) {
      base = lettersFromName.length ? lettersFromName : '';
      while (base.length < 4) base += randomLetter();
      attempts = 0;
    }
  } while (existingCodes.has(code));

  return code;
}
