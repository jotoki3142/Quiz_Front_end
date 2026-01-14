'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/lib/user';
import toast from 'react-hot-toast';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import TeacherHeader from '@/components/teacher/TeacherHeader';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

const TeacherAuthGuard = ({ children }: { children: React.ReactNode }) => {
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
    } else if (user?.role !== "TEACHER") {
      redirectPath = "/";
      toastMessage = "Bạn không có quyền truy cập vào khu vực giáo viên.";
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
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "TEACHER") return null;

  return <>{children}</>;
};

export default function Layout({ children }: TeacherLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path === "/teacher/teacherhome") return "Tổng quan";
    if (path.includes("/teacher/categories")) return "Quản lý Danh mục";
    if (path.includes("/teacher/questions")) return "Ngân hàng Câu hỏi";
    if (path.includes("/teacher/list-exam")) return "Danh sách Bài thi";
    if (path.includes("/teacher/exam-offline")) return "Tạo Bài thi";
    if (path.includes("/teacher/exams")) return "Quản lý Bài thi";
    return "Bảng điều khiển Giáo viên";
  };

  return (
    <TeacherAuthGuard>
      <div className="min-h-screen bg-zinc-50/50">
        <TeacherSidebar
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        <div className="transition-all duration-300 lg:pl-64">
          <TeacherHeader
            title={getPageTitle(pathname || "")}
            onMenuClick={() => setIsMobileOpen(true)}
          />

          <main className="px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="mt-auto py-6 text-center text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} QuizzZone. Teacher Dashboard.
          </footer>
        </div>
      </div>
    </TeacherAuthGuard>
  );
}

