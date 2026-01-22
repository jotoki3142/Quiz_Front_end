'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/user';
import toast from 'react-hot-toast';
import StudentHeader from '@/components/student/StudentHeader';

interface StudentLayoutProps {
    children: React.ReactNode;
}

const StudentAuthGuard = ({ children }: { children: React.ReactNode }) => {
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
        } else if (user?.role !== "STUDENT") {
            redirectPath = "/";
            toastMessage = "Bạn không có quyền truy cập vào khu vực học sinh.";
        }

        if (redirectPath) {
            hasRedirectedRef.current = true;
            if (toastMessage) toast.error(toastMessage);
            router.push(redirectPath);
        }
    }, [user, isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-fuchsia-50">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-fuchsia-600 border-b-2"></div>
                    <p className="mt-4 text-lg font-semibold text-fuchsia-900">Đang tải dữ liệu học tập...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== "STUDENT") return null;

    return <>{children}</>;
};

export default function Layout({ children }: StudentLayoutProps) {
    return (
        <StudentAuthGuard>
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
                <StudentHeader />
                <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
                <footer className="mt-auto border-t border-zinc-200 bg-white py-8">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-sm text-zinc-500 font-medium">
                            &copy; {new Date().getFullYear()} QuizzZone. Nền tảng ôn thi trực tuyến.
                        </p>
                    </div>
                </footer>
            </div>
        </StudentAuthGuard>
    );
}

