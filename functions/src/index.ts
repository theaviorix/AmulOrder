// functions/src/index.ts
//
// Deletes the CALLING user's own account: their supplier/customer data
// across every Firestore collection, then their Firebase Auth user.
//
// This must run as a Cloud Function (not client-side) because deleting an
// Auth user and running unrestricted Firestore writes requires the Admin
// SDK's elevated privileges, which must never be shipped to the browser.
//
// Deploy with:
//   firebase deploy --only functions

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp();
const db = getFirestore();
const auth = getAuth();

export const deleteAccount = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError('unauthenticated', 'You must be signed in to delete your account.');
  }

  try {
    // Find the supplier/customer profile docs for this user, since a lot of
    // other collections reference the *profile* id rather than the auth uid.
    const [supplierSnap, customerSnap] = await Promise.all([
      db.collection('supplier_profiles').where('user_id', '==', userId).limit(1).get(),
      db.collection('customer_profiles').where('user_id', '==', userId).limit(1).get(),
    ]);
    const supplierProfileId = supplierSnap.docs[0]?.id;
    const customerProfileId = customerSnap.docs[0]?.id;

    // Deletes every doc in `collection` matching `field == value`.
    const deleteWhere = async (collection: string, field: string, value: string) => {
      const snap = await db.collection(collection).where(field, '==', value).get();
      await Promise.all(snap.docs.map((d) => d.ref.delete()));
    };

    await Promise.all([
      deleteWhere('bills', 'supplier_user_id', userId),
      deleteWhere('bills', 'customer_user_id', userId),
      deleteWhere('orders', 'supplier_user_id', userId),
      deleteWhere('orders', 'customer_user_id', userId),
      deleteWhere('notifications', 'user_id', userId),
      deleteWhere('reviews', 'supplier_user_id', userId),
      deleteWhere('reviews', 'customer_user_id', userId),
      deleteWhere('products', 'supplier_user_id', userId),
      deleteWhere('messages', 'supplier_user_id', userId),
      deleteWhere('messages', 'customer_user_id', userId),
    ]);

    await Promise.all([
      deleteWhere('supplier_links', 'supplier_user_id', userId),
      deleteWhere('supplier_links', 'customer_user_id', userId),
    ]);

    await Promise.all([
      supplierProfileId ? db.collection('supplier_profiles').doc(supplierProfileId).delete() : Promise.resolve(),
      customerProfileId ? db.collection('customer_profiles').doc(customerProfileId).delete() : Promise.resolve(),
      db.collection('profiles').doc(userId).delete(),
    ]);

    // Finally, delete the Auth user itself — this frees up the email
    // address and is irreversible.
    await auth.deleteUser(userId);

    return { success: true };
  } catch (err: any) {
    console.error('deleteAccount error:', err);
    throw new HttpsError('internal', err.message || 'Failed to delete account');
  }
});
