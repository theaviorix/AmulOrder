import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as fbSignIn,
  signOut as fbSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword as fbUpdatePassword,
  onAuthStateChanged,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebaseClient';
import { store, waitUntilReady } from './store';

// Firebase Auth errors always have a `.code` (e.g. 'auth/invalid-credential')
// and a `.message`, but the message is verbose ("Firebase: Error (auth/...)").
// This maps common codes to plain-English text, falling back to the raw
// message for anything unmapped.
const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Could not reach the server. Check your connection and try again.',
};

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err.code && AUTH_ERROR_MESSAGES[err.code]) return AUTH_ERROR_MESSAGES[err.code];
  if (err.message && typeof err.message === 'string') return err.message;
  return fallback;
}

// --- Auth actions -----------------------------------------------------

export async function signUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Create the `profiles/{uid}` doc up front (role is set later in onboarding).
  await setDoc(doc(db, 'profiles', cred.user.uid), {
    id: cred.user.uid,
    email,
    role: null,
    created_date: new Date().toISOString(),
  });
  await sendEmailVerification(cred.user);
  return { user: cred.user };
}

export async function resendSignupEmail() {
  if (!auth.currentUser) throw new Error('No signed-in user to resend a verification email to.');
  await sendEmailVerification(auth.currentUser);
}

export async function signIn(email, password) {
  const cred = await fbSignIn(auth, email, password);
  return { user: cred.user };
}

export async function signOut() {
  await fbSignOut(auth);
}

export async function requestPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function updatePassword(newPassword) {
  if (!auth.currentUser) throw new Error('No signed-in user.');
  await fbUpdatePassword(auth.currentUser, newPassword);
}

// --- Password reset via emailed link (oobCode) --------------------------
// Unlike Supabase, clicking a Firebase reset-password email does NOT create
// a signed-in session — it just carries an `oobCode` query param. The
// ResetPassword page reads that from the URL and passes it through here.

export async function verifyResetCode(oobCode) {
  // Throws if the code is invalid/expired; resolves to the account's email otherwise.
  return verifyPasswordResetCode(auth, oobCode);
}

export async function confirmReset(oobCode, newPassword) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

export async function getSession() {
  return auth.currentUser
    ? { user: auth.currentUser, access_token: await auth.currentUser.getIdToken() }
    : null;
}

// Mirrors supabase.auth.onAuthStateChange(callback) — callback receives a
// "session"-shaped object (or null) so calling code doesn't need to change.
export function onAuthStateChange(callback) {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    callback(user ? { user } : null);
  });
  return unsubscribe;
}

// --- Profile lookups ----------------------------------------------------
// A "profile" here is the doc in `profiles/{uid}` (role) plus the matching
// supplier_profiles/customer_profiles doc (business/shop details).

export async function getMyProfile(userId) {
  const profileSnap = await getDoc(doc(db, 'profiles', userId));
  if (!profileSnap.exists()) throw new Error('Profile not found.');
  const profile = { id: profileSnap.id, ...profileSnap.data() };

  if (!profile.role) return { profile, roleProfile: null };

  // supplier_profiles/customer_profiles are keyed by user_id, not by their
  // own doc id — see src/lib/store.js. Wait for this table's first
  // Firestore snapshot before trusting a "not found" — right after login
  // the in-memory cache can still be empty, which would otherwise look
  // identical to "this account has no profile yet".
  const table = profile.role === 'supplier' ? 'supplier_profiles' : 'customer_profiles';
  // Race against a timeout: if Firestore errors out (e.g. a rules issue)
  // the listener's promise would otherwise never resolve and login would
  // hang forever instead of failing visibly.
  await Promise.race([waitUntilReady(table), new Promise((r) => setTimeout(r, 6000))]);
  const roleProfile = store.find(table, (r) => r.user_id === userId) || null;

  return { profile, roleProfile };
}

export async function setMyRole(userId, role) {
  await updateDoc(doc(db, 'profiles', userId), { role });
}
