import { Outlet } from "react-router";
import AdminNavbar from "@/components/AdminNavbar";
import AdminSidebar from "@/components/AdminSidebar";
import ScrollToTop from "@/components/ScrollToTop";

// Protected by <RequireRole> and <RequireActiveClinic> in the router
export default function AdminLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <ScrollToTop />
      <AdminNavbar />
      <div className="w-full flex-1 px-4 pt-6 pb-12 md:pt-8">
        <div className="grid content-start gap-6 md:grid-cols-[15rem_1fr] md:gap-10">
          <AdminSidebar />
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
