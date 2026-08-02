import { LayoutDashboard, ShoppingBag, ClipboardList, Wallet } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/session";
import { Navigate } from "react-router-dom";

const items = [
  { path: "/customer", label: "Dashboard", icon: LayoutDashboard },
  { path: "/customer/shop", label: "Shop / New Order", icon: ShoppingBag },
  { path: "/customer/orders", label: "My Orders", icon: ClipboardList },
  { path: "/customer/bills", label: "Bills & Balance", icon: Wallet },
];

export default function CustomerLayout() {
  const session = getSession();
  if (!session || session.role !== "customer") return <Navigate to="/" replace />;
  return <DashboardShell items={items} roleLabel="Retailer" targetId={session.id} notifType="customer" />;
}