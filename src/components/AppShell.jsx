import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Boxes, Users, Wallet, ShoppingCart, Package, LogOut, Menu, X, MessageCircle, Table2 } from 'lucide-react';
import { useSession } from '@/lib/AppSession';
import { signOut } from '@/lib/firebaseAuth';
import { useStore } from '@/lib/useStore';
import { store } from '@/lib/store';
import { checkAndFireReminder } from '@/lib/orderReminder';
import NotificationBell from '@/components/NotificationBell';
import Avatar from '@/components/Avatar';
import Logo from '@/components/Logo';
import Modal from '@/components/Modal';

const NAV = {
  supplier: [
    { to: '/supplier', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/supplier/orders', label: 'Orders', icon: ClipboardList },
    { to: '/supplier/products', label: 'Products', icon: Boxes },
    { to: '/supplier/customers', label: 'Customers', icon: Users },
    { to: '/supplier/billing', label: 'Billing', icon: Wallet },
    { to: '/supplier/bill-sheet', label: 'Bill Sheet', icon: Table2 },
    { to: '/supplier/messages', label: 'Messages', icon: MessageCircle },
  ],
  customer: [
    { to: '/customer/new-order', label: 'New Order', icon: ShoppingCart },
    { to: '/customer/orders', label: 'My Orders', icon: Package },
    { to: '/customer/bills', label: 'Bills', icon: Wallet },
    { to: '/customer/messages', label: 'Messages', icon: MessageCircle },
  ],
};

function Sidebar({ nav, onLogoutClick, unreadMessages, avatar, displayName }) {
  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-jet text-surface' : 'text-ink2 hover:bg-canvas hover:text-ink'}`}>
            <item.icon size={18} />
            <span className="flex-1">{item.label}</span>
            {item.label === 'Messages' && unreadMessages > 0 && (
              <span className="w-5 h-5 rounded-full bg-alert text-surface text-[10px] font-bold grid place-items-center shrink-0">{unreadMessages}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-mist space-y-1">
        <NavLink to="/profile" className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-jet text-surface' : 'text-ink2 hover:bg-canvas hover:text-ink'}`}>
          <Avatar src={avatar} name={displayName} size="xs" />
          My Profile
        </NavLink>
        <button onClick={onLogoutClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink2 hover:bg-canvas hover:text-ink transition-colors">
          <LogOut size={18} /> Log out
        </button>
      </div>
    </>
  );
}

export default function AppShell() {
  const { session, loading, clearSession } = useSession();
  const liveStore = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false); // mounted?
  const [drawerVisible, setDrawerVisible] = useState(false); // slid into view?
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => { closeDrawer(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDrawer = () => {
    setDrawer(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisible(true)));
  };
  const closeDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => setDrawer(false), 250);
  };

  // The store is Firestore-backed and reactive (liveStore re-renders this
  // component on every 'amul-store-change'), so no polling/interval is
  // needed here — an avatar/name change in EditProfile shows up immediately.
  const table = session?.role === 'supplier' ? 'supplier_profiles' : 'customer_profiles';
  const myProfile = session?.profileId ? liveStore.get(table, session.profileId) : null;

  let avatar = myProfile?.avatar || null;
  let displayName = session?.role === 'supplier' ? myProfile?.business_name : myProfile?.shop_name;
  let unreadMessages = 0;
  if (session?.role === 'supplier') {
    unreadMessages = liveStore.filter('messages', (m) => m.supplier_user_id === session.userId && m.sender === 'customer' && !m.read_by_supplier).length;
  } else if (session?.role === 'customer') {
    unreadMessages = liveStore.filter('messages', (m) => m.customer_user_id === session.userId && m.sender === 'supplier' && !m.read_by_customer).length;
  }

  // Client-side order reminder: while a retailer has the app open, check
  // every 30s whether their saved reminder time has passed for today.
  // (This only fires while the tab is open — there's no push/background
  // notification without a real backend.)
  useEffect(() => {
    if (!session || session.role !== 'customer' || !session.profileId) return;
    const check = () => {
      const profile = store.get('customer_profiles', session.profileId);
      if (profile) checkAndFireReminder(profile, session.userId);
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas grid place-items-center">
        <div className="w-8 h-8 border-4 border-mist border-t-ink rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!session.role || !session.profileId) return <Navigate to="/onboarding" replace />;
  const isProfileArea = location.pathname.startsWith('/profile');
  const isSupplierArea = location.pathname.startsWith('/supplier');
  if (!isProfileArea && session.role === 'customer' && isSupplierArea) return <Navigate to="/customer/new-order" replace />;
  if (!isProfileArea && session.role === 'supplier' && !isSupplierArea) return <Navigate to="/supplier" replace />;
  const nav = NAV[session.role] || [];
  const roleLabel = session.role === 'supplier' ? 'Supplier' : 'Retailer';
  const doLogout = async () => { setConfirmLogout(false); await signOut(); clearSession(); navigate('/'); };

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-surface border-r border-mist flex-col">
        <div className="h-16 flex items-center px-5 border-b border-mist"><Logo /></div>
        <Sidebar nav={nav} onLogoutClick={() => setConfirmLogout(true)} unreadMessages={unreadMessages} avatar={avatar} displayName={displayName} />
      </aside>

      <div className="lg:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-mist h-14 flex items-center justify-between px-4">
        <button onClick={openDrawer} className="p-2 -ml-2 text-ink"><Menu size={22} /></button>
        <Logo compact />
        <div className="w-9" />
      </div>

      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          />
          <div
            className={`absolute inset-y-0 left-0 w-72 bg-surface flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
              drawerVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-mist">
              <Logo compact />
              <button onClick={closeDrawer} className="p-2"><X size={20} /></button>
            </div>
            <Sidebar nav={nav} onLogoutClick={() => setConfirmLogout(true)} unreadMessages={unreadMessages} avatar={avatar} displayName={displayName} />
          </div>
        </div>
      )}

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Log out?"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmLogout(false)} className="px-4 py-2.5 rounded-xl border border-mist text-ink font-medium hover:bg-canvas transition-colors">
              Cancel
            </button>
            <button onClick={doLogout} className="px-4 py-2.5 rounded-xl bg-jet text-surface font-medium hover:bg-ink transition-colors">
              Log out
            </button>
          </>
        }
      >
        <p className="text-sm text-ink2">You’ll need to log in again to access your {roleLabel.toLowerCase()} workspace.</p>
      </Modal>

      <div className="lg:pl-64">
        <header className="hidden lg:flex relative z-30 h-16 items-center justify-between px-6 bg-surface/60 backdrop-blur border-b border-mist">
          <span className="text-xs font-mono uppercase tracking-widest text-ink2">{roleLabel} workspace</span>
          <NotificationBell />
        </header>
        <div className="lg:hidden relative z-30 flex items-center justify-end px-4 py-2"><NotificationBell /></div>
        <main className="p-4 sm:p-6 max-w-6xl mx-auto w-full"><Outlet /></main>
      </div>
    </div>
  );
}