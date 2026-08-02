import { LayoutDashboard, Package, Users, ClipboardList, Receipt, ScrollText } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/session";
import { Navigate } from "react-router-dom";

const items = [
  { path: "/supplier", label: "Dashboard", icon: LayoutDashboard },
  { path: "/supplier/products", label: "Price List", icon: Package },
  { path: "/supplier/customers", label: "Customers", icon: Users },
  { path: "/supplier/orders", label: "Orders", icon: ClipboardList },
  { path: "/supplier/billing", label: "Billing", icon: Receipt },
  { path: "/supplier/statement", label: "Statements", icon: ScrollText },
];

export default function SupplierLayout() {
  const session = getSession();
  if (!session || session.role !== "supplier") return <Navigate to="/" replace />;
  return <DashboardShell items={items} roleLabel="Supplier" targetId={session.id} notifType="supplier" />;
}