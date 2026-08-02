import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import { SessionProvider } from '@/lib/AppSession';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import VerifyEmail from '@/pages/VerifyEmail';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Onboarding from '@/pages/Onboarding';
import AppShell from '@/components/AppShell';
import EditProfile from '@/pages/EditProfile';
import SupplierOverview from '@/pages/supplier/Overview';
import SupplierProducts from '@/pages/supplier/Products';
import SupplierOrders from '@/pages/supplier/Orders';
import SupplierCustomers from '@/pages/supplier/Customers';
import SupplierCustomerHistory from '@/pages/supplier/CustomerHistory';
import SupplierBilling from '@/pages/supplier/Billing';
import SupplierBillSheet from '@/pages/supplier/BillSheet';
import SupplierMessages from '@/pages/supplier/Messages';
import CustomerNewOrder from '@/pages/customer/NewOrder';
import CustomerOrders from '@/pages/customer/MyOrders';
import CustomerBills from '@/pages/customer/Bills';
import CustomerMessages from '@/pages/customer/Messages';

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<AppShell />}>
        <Route path="profile" element={<EditProfile />} />
        <Route path="supplier" element={<SupplierOverview />} />
        <Route path="supplier/products" element={<SupplierProducts />} />
        <Route path="supplier/orders" element={<SupplierOrders />} />
        <Route path="supplier/customers" element={<SupplierCustomers />} />
        <Route path="supplier/customers/:linkId" element={<SupplierCustomerHistory />} />
        <Route path="supplier/billing" element={<SupplierBilling />} />
        <Route path="supplier/bill-sheet" element={<SupplierBillSheet />} />
        <Route path="supplier/messages" element={<SupplierMessages />} />
        <Route path="customer" element={<CustomerNewOrder />} />
        <Route path="customer/new-order" element={<CustomerNewOrder />} />
        <Route path="customer/orders" element={<CustomerOrders />} />
        <Route path="customer/bills" element={<CustomerBills />} />
        <Route path="customer/messages" element={<CustomerMessages />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <SessionProvider>
          <AuthenticatedApp />
        </SessionProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App