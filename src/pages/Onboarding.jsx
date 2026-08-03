import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Store, ShoppingCart, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/AppSession';
import { store, waitUntilReady } from '@/lib/store';
import { setMyRole, getErrorMessage } from '@/lib/firebaseAuth';
import { generateFreeInviteCode } from '@/lib/inviteCode';
import Logo from '@/components/Logo';

function Field({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink2 mb-1.5 block">{label}{required && <span className="text-alert"> *</span>}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-mist bg-surface px-3.5 py-3 text-ink text-[16px] outline-none focus:border-ink transition-colors"
      />
    </label>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { session, loading, refreshSession } = useSession();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  // Role is chosen and locked in at signup time now (see Register.jsx) — by
  // the time someone reaches Onboarding, session.role should already be set
  // in Firestore. The URL param and the RoleChooser fallback below only
  // matter for older accounts created before that change.
  const initialRole = session?.role === 'supplier' || session?.role === 'customer'
    ? session.role
    : (roleParam === 'supplier' || roleParam === 'customer' ? roleParam : null);
  const [role, setRole] = useState(initialRole);

  // session resolves asynchronously (auth + Firestore), so it's often still
  // null on first render — this catches a role that shows up a moment later
  // without making the user click through the RoleChooser again.
  useEffect(() => {
    if (!role && (session?.role === 'supplier' || session?.role === 'customer')) {
      setRole(session.role);
    }
  }, [session?.role, role]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ business_name: '', shop_name: '', owner_name: '', phone: '', address: '', gstin: '', invite_code: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas grid place-items-center px-5">
        <Loader2 className="w-6 h-6 animate-spin text-ink2" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-canvas grid place-items-center px-5">
        <div className="text-center max-w-sm">
          <p className="text-ink2">You need to be logged in to finish setting up your account.</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-ink underline">Go to login</Link>
        </div>
      </div>
    );
  }

  const startSupplier = () => setRole('supplier');
  const startCustomer = () => { setRole('customer'); setStep(1); };

  const submitSupplier = async () => {
    if (!form.business_name.trim()) { setError('Business name is required'); return; }
    setError('');
    setSaving(true);
    try {
      const inviteCode = await generateFreeInviteCode(form.business_name);
      store.create('supplier_profiles', {
        user_id: session.userId,
        business_name: form.business_name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        gstin: form.gstin.trim(),
        invite_code: inviteCode,
      });

      const samples = [
        { name: 'Amul Gold Milk', unit: '1 L', price: 64 },
        { name: 'Amul Gold Milk', unit: '500 ml', price: 27 },
        { name: 'Amul Taaza', unit: '500 ml', price: 25 },
        { name: 'Amul Butter', unit: '100 g', price: 56 },
        { name: 'Amul Cheese', unit: '200 g', price: 130 },
        { name: 'Amul Ghee', unit: '500 ml', price: 240 },
        { name: 'Amul Curd', unit: '500 g', price: 35 },
      ];
      samples.forEach((p) => store.create('products', { supplier_user_id: session.userId, ...p, active: true, in_stock: true }));

      await setMyRole(session.userId, 'supplier');
      await refreshSession();
      navigate('/supplier');
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong setting up your business. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const submitCustomerProfile = () => {
    if (!form.shop_name?.trim()) { setError('Shop name is required'); return; }
    setError('');
    setStep(2);
  };

  const linkSupplier = async () => {
    const code = (form.invite_code || '').trim().toUpperCase();
    if (!code) { setError("Enter your supplier's invite code"); return; }
    setError('');
    setSaving(true);
    try {
      // Wait for the supplier_profiles collection's first Firestore
      // snapshot before trusting a "not found" — otherwise a fast click
      // right after page load can check an still-empty cache and wrongly
      // report a valid code as invalid.
      await Promise.race([waitUntilReady('supplier_profiles'), new Promise((r) => setTimeout(r, 6000))]);
      const sup = store.find('supplier_profiles', (s) => s.invite_code === code);
      if (!sup) { setError('Invalid invite code. Check with your supplier.'); setSaving(false); return; }

      const shopName = (form.shop_name || '').trim() || 'Shop';
      const cprof = store.create('customer_profiles', {
        user_id: session.userId,
        shop_name: shopName,
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      store.create('supplier_links', {
        customer_user_id: session.userId,
        customer_profile_id: cprof.id,
        customer_name: shopName,
        supplier_user_id: sup.user_id,
        supplier_profile_id: sup.id,
        status: 'active',
      });

      store.create('notifications', {
        user_id: sup.user_id,
        type: 'link_request',
        text: `${shopName} joined your network.`,
        link: '/supplier/customers',
      });

      await setMyRole(session.userId, 'customer');
      await refreshSession();
      navigate('/customer/new-order');
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong linking to your supplier. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="px-5 h-16 flex items-center justify-between max-w-6xl mx-auto">
        <Logo />
        <Link to="/" className="text-sm text-ink2 hover:text-ink inline-flex items-center gap-1.5"><ArrowLeft size={15} /> Back to site</Link>
      </div>

      <div className="max-w-md mx-auto px-5 py-8">
        {!role && (
          <RoleChooser onSupplier={startSupplier} onCustomer={startCustomer} />
        )}
        {role === 'supplier' && (
          <Card title="Set up your distributor business" step="Step 1 of 1">
            <div className="space-y-4">
              <Field label="Business name" value={form.business_name} onChange={set('business_name')} placeholder="e.g. Sharma Dairy Distributors" required />
              <Field label="Owner name" value={form.owner_name} onChange={set('owner_name')} placeholder="Your name" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="98xxxxxxxx" />
                <Field label="GSTIN" value={form.gstin} onChange={set('gstin')} placeholder="Optional" />
              </div>
              <Field label="Address" value={form.address} onChange={set('address')} placeholder="Godown / warehouse address" />
              {error && <p className="text-sm text-alert">{error}</p>}
              <button onClick={submitSupplier} disabled={saving} className="w-full bg-jet text-surface font-medium py-3.5 rounded-xl hover:bg-ink transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null} Continue {!saving && <ArrowRight size={16} />}
              </button>
            </div>
          </Card>
        )}
        {role === 'customer' && step === 1 && (
          <Card title="Set up your shop" step="Step 1 of 2">
            <div className="space-y-4">
              <Field label="Shop name" value={form.shop_name} onChange={set('shop_name')} placeholder="e.g. FreshMart Kirana" required />
              <Field label="Owner name" value={form.owner_name} onChange={set('owner_name')} placeholder="Your name" />
              <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="98xxxxxxxx" />
              <Field label="Address" value={form.address} onChange={set('address')} placeholder="Shop address" />
              {error && <p className="text-sm text-alert">{error}</p>}
              <button onClick={submitCustomerProfile} className="w-full bg-jet text-surface font-medium py-3.5 rounded-xl hover:bg-ink transition-colors">Next</button>
            </div>
          </Card>
        )}
        {role === 'customer' && step === 2 && (
          <Card title="Link to your supplier" step="Step 2 of 2">
            <p className="text-sm text-ink2 mb-4">Your supplier shared an invite code with you (looks like <span className="font-mono text-ink">SHARMA-482</span>). Enter it below.</p>
            <div className="space-y-4">
              <Field label="Invite code" value={form.invite_code} onChange={set('invite_code')} placeholder="SHARMA-482" required />
              {error && <p className="text-sm text-alert">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-3.5 rounded-xl border border-mist text-ink font-medium hover:bg-canvas transition-colors">Back</button>
                <button onClick={linkSupplier} disabled={saving} className="flex-1 bg-jet text-surface font-medium py-3.5 rounded-xl hover:bg-ink transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null} {!saving && <>Connect & start <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function RoleChooser({ onSupplier, onCustomer }) {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-display font-bold text-ink text-3xl tracking-tight">How will you use Amul Connect?</h1>
        <p className="mt-3 text-ink2">Choose your side to get started.</p>
      </div>
      <div className="grid gap-3">
        <RoleCard onClick={onSupplier} icon={Store} title="I'm a Supplier" subtitle="Distribute to retailers · manage orders & billing" cta="Get started" />
        <RoleCard onClick={onCustomer} icon={ShoppingCart} title="I'm a Retailer" subtitle="Order from your distributor · track & pay bills" cta="Get started" />
      </div>
    </>
  );
}

function RoleCard({ onClick, icon: Icon, title, subtitle, cta }) {
  return (
    <button onClick={onClick} className="group text-left rounded-2xl border border-mist bg-surface p-6 hover:border-ink2/30 hover:shadow-lg transition-all">
      <span className="w-12 h-12 rounded-xl bg-jet text-surface grid place-items-center"><Icon size={22} /></span>
      <h3 className="mt-4 font-display font-semibold text-ink text-lg">{title}</h3>
      <p className="mt-1 text-sm text-ink2">{subtitle}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink">{cta} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" /></span>
    </button>
  );
}

function Card({ title, step, children }) {
  return (
    <>
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-widest text-ink2">{step}</span>
        <h1 className="mt-1 font-display font-bold text-ink text-2xl tracking-tight">{title}</h1>
      </div>
      <div className="rounded-2xl border border-mist bg-surface p-6 shadow-sm">{children}</div>
    </>
  );
}
