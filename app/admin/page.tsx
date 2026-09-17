import { hasAdminSession } from "../admin-auth";
import AdminDashboard from "./AdminDashboard";
import AdminPinGate from "./AdminPinGate";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await hasAdminSession())) return <AdminPinGate />;
  return <AdminDashboard email="Owner access" name="Studio admin" />;
}
