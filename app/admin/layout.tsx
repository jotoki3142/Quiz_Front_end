"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/user";
import toast from "react-hot-toast";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminAuthGuard = ({ children }: AdminAuthGuardProps) => {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirectedRef.current) return;

    let redirectPath = null;
    let toastMessage = null;

    if (!isAuthenticated) {
      redirectPath = "/auth/login";
      toastMessage = "Bạn cần đăng nhập để truy cập trang này.";
    } else if (user?.role !== "ADMIN") {
      redirectPath = "/";
      toastMessage = "Bạn không có quyền truy cập vào khu vực quản trị.";
    }

    if (redirectPath) {
      hasRedirectedRef.current = true;
      if (toastMessage) toast.error(toastMessage);
      router.push(redirectPath);
    }
  }, [user, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-violet-600 border-b-2"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  return <>{children}</>;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname(); // Need to import usePathname

  const getPageTitle = (path: string) => {
    if (path === "/admin") return "Tổng quan";
    if (path.includes("/admin/accounts/teachers")) return "Quản lý Giáo viên";
    if (path.includes("/admin/accounts/students")) return "Quản lý Học sinh";
    if (path.includes("/admin/approve-teachers")) return "Duyệt Giáo viên";
    if (path.includes("/admin/exams")) return "Quản lý Bài thi";
    if (path.includes("/admin/categories")) return "Quản lý Danh mục";
    if (path.includes("/admin/questions")) return "Ngân hàng Câu hỏi";
    return "Quản trị hệ thống";
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-zinc-50/50">
        <AdminSidebar
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        <div className="transition-all duration-300 lg:pl-64">
          <AdminHeader
            title={getPageTitle(pathname || "")}
            onMenuClick={() => setIsMobileOpen(true)}
          />

          <main className="px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="mt-auto py-6 text-center text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} QuizzZone. Admin Dashboard.
          </footer>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
