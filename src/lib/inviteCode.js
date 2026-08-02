import { store } from './store';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const randomLetter = () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)];

// Generates a candidate invite code from the business name and confirms
// it's actually free (checked against the in-memory supplier_profiles
// cache, which mirrors Firestore -- see src/lib/store.js).
export async function generateFreeInviteCode(businessName) {
  const lettersFromName = (businessName || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  for (let attempt = 0; attempt < 10; attempt++) {
    let base = lettersFromName;
    while (base.length < 4) base += randomLetter();
    const suffix = Math.floor(100 + Math.random() * 900);
    const code = `${base}-${suffix}`;
    const taken = store.find('supplier_profiles', (s) => s.invite_code === code);
    if (!taken) return code;
  }
  return `SHOP-${Date.now().toString(36).toUpperCase()}`;
}

// Self-heals a supplier profile that's missing its invite code (e.g. an
// older row created before invite codes existed, or a manual edit).
// Generates one, saves it, and returns the profile with the code attached.
export async function ensureInviteCode(profile) {
  if (!profile || profile.invite_code) return profile;
  const code = await generateFreeInviteCode(profile.business_name);
  const updated = store.update('supplier_profiles', profile.id, { invite_code: code });
  if (!updated) {
    console.error('Failed to backfill missing invite code: profile not found in store.');
    return profile;
  }
  return updated;
}
