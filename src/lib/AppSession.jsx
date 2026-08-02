import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChange, getMyProfile } from './firebaseAuth';
import { store, waitUntilReady } from './store';

const SessionContext = createContext(null);

export function useSession() {
  return useContext(SessionContext);
}

// Builds the app-facing session shape (role, profileId, and — for
// customers — their linked supplier's ids) from a Firebase auth user.
async function buildSession(authUser) {
  if (!authUser) return null;
  const { profile, roleProfile } = await getMyProfile(authUser.uid);

  const base = {
    userId: authUser.uid,
    accountId: authUser.uid, // kept for pages still expecting the old field name
    email: authUser.email,
    role: profile.role || null,
    profileId: roleProfile?.id || null,
  };

  if (profile.role === 'customer' && roleProfile) {
    await Promise.race([waitUntilReady('supplier_links'), new Promise((r) => setTimeout(r, 6000))]);
    const link = store.find('supplier_links', (l) => l.customer_profile_id === roleProfile.id);
    if (link) {
      base.linkId = link.id;
      base.supplierUserId = link.supplier_user_id;
      base.supplierProfileId = link.supplier_profile_id;
    }
  }

  return base;
}

export function SessionProvider({ children }) {
  const [session, setSessionState] = useState(null);
  const [loading, setLoading] = useState(true);
  // The last raw Firebase auth user we saw, so refreshSession() can rebuild
  // the session (e.g. after onboarding sets a role) without waiting for
  // another onAuthStateChanged event.
  const [authUser, setAuthUser] = useState(null);

  const refreshSession = useCallback(async () => {
    const next = await buildSession(authUser);
    setSessionState(next);
    return next;
  }, [authUser]);

  useEffect(() => {
    let active = true;
    // Firebase Auth restores any persisted session asynchronously — unlike
    // Supabase, there's no synchronous "getSession()" you can trust on first
    // load, so onAuthStateChanged is the only source of truth, including
    // for the very first check.
    const unsubscribe = onAuthStateChange(async (authSession) => {
      const user = authSession?.user || null;
      const next = await buildSession(user);
      if (active) {
        setAuthUser(user);
        setSessionState(next);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    setAuthUser(null);
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading, refreshSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}
