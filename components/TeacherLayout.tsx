'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/lib/user';
import toast from 'react-hot-toast';
import ProfileDropdown from '@/components/ProfileDropdown';
import {
    HomeIcon,
    FolderIcon,
    DocumentTextIcon,
    QuestionMarkCircleIcon,
    ClipboardDocumentListIcon,
    ChevronDownIcon,
    ListBulletIcon,
    PlusCircleIcon
} from "@heroicons/react/24/outline";

/** @type {React.FC<{ children: React.ReactNode }>} */
const TeacherAuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading, isAuthenticated } = useUser();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (isLoading || isRedirecting) {
            return;
        }

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
            setIsRedirecting(true);
            if (toastMessage) {
                toast.error(toastMessage);
            }
            router.push(redirectPath);
        }

    }, [user, isLoading, isAuthenticated, router, isRedirecting]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2"></div>
                    <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải dữ liệu người dùng...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== "TEACHER") {
        return null;
    }

    return <>{children}</>;
};

/** @type {React.FC} */
const TeacherSidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { href: '/teacher/teacherhome', label: 'Trang chủ' },
        { href: '/teacher/categories', label: 'Danh mục' },
        { href: '/teacher/questions', label: 'Quản lý câu hỏi' },
        {
            label: 'Quản lý bài thi',
            href: '/teacher/exams',
            submenu: [
                { label: "Danh sách bài thi", href: "/teacher/list-exam" },
                { label: "Tạo bài thi", href: "/teacher/exam-offline" },
            ],
        },
    ];

    // Icon mapping for menu items
    const getIcon = (label: string) => {
        switch (label) {
            case 'Trang chủ':
                return <HomeIcon className="w-5 h-5" />;
            case 'Danh mục':
                return <FolderIcon className="w-5 h-5" />;
            case 'Quản lý câu hỏi':
                return <QuestionMarkCircleIcon className="w-5 h-5" />;
            case 'Quản lý bài thi':
                return <ClipboardDocumentListIcon className="w-5 h-5" />;
            default:
                return null;
        }
    };

    const [userToggledSubmenu, setUserToggledSubmenu] = useState<string | null>(null);

    const handleToggleSubmenu = (label: string) => {
        setUserToggledSubmenu(userToggledSubmenu === label ? null : label);
    };

    const isActive = (item: any): boolean => {
        if (!item || !item.href) return false;
        if (item.href === "/teacher/teacherhome") return pathname === "/teacher/teacherhome";

        let shouldBeActive = pathname.startsWith(item.href);
        if (item.submenu) {
            shouldBeActive = item.submenu.some((subItem: any) =>
                pathname.startsWith(subItem.href)
            ) || shouldBeActive;
        }
        return shouldBeActive;
    };

    const getActiveSubmenu = (): string | null => {
        for (const item of navItems) {
            if (item.submenu) {
                if (item.submenu.some(subItem => pathname.startsWith(subItem.href))) {
                    return item.label;
                }
            }
        }
        return null;
    };

    const activeSubmenu = userToggledSubmenu !== null ? userToggledSubmenu : getActiveSubmenu();

    const handleNavigation = (href: string, e: React.MouseEvent) => {
        e.preventDefault();
        router.push(href);
    }

    return (
        <aside className="w-64 bg-white border-r border-zinc-200 h-screen fixed top-0 left-0 z-50 shadow-xl overflow-y-auto">
            <div className="flex items-center space-x-2 px-4 py-3 border-b border-zinc-200 bg-white">
                <button
                    type="button"
                    onClick={(e) => handleNavigation('/teacher/teacherhome', e as any)}
                    className="text-3xl font-black tracking-tighter text-[#E33AEC]"
                >
                    QuizzZone
                </button>
            </div>

            <nav className="px-4 py-4 text-sm font-medium text-zinc-700 space-y-1">
                {navItems.map((item) => {
                    const hasSubmenu = !!item.submenu;
                    const isCurrentActive = isActive(item);
                    const isOpen = activeSubmenu === item.label || (hasSubmenu && isCurrentActive);

                    if (hasSubmenu) {
                        return (
                            <div key={item.label}>
                                <button
                                    onClick={() => handleToggleSubmenu(item.label)}
                                    className={`flex items-center w-full rounded-lg px-3 py-2 text-left transition-colors duration-150
                      ${isCurrentActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
                    `}
                                >
                                    {getIcon(item.label)}
                                    <span className="ml-3">{item.label}</span>
                                    <ChevronDownIcon className={`w-4 h-4 ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                                        }`}
                                >
                                    {item.submenu && item.submenu.map((subItem) => {
                                        const subIsActive = pathname.startsWith(subItem.href);
                                        return (
                                            <a
                                                key={subItem.label}
                                                href={subItem.href}
                                                onClick={(e) => handleNavigation(subItem.href, e)}
                                                className={`mt-1 ml-4 flex items-center w-full rounded-lg px-3 py-1.5 text-xs transition-colors duration-150
                            ${subIsActive ? "bg-zinc-100 text-purple-700 font-semibold" : "hover:bg-zinc-50"}
                          `}
                                            >
                                                <span className="w-5 h-5 mr-3 flex items-center justify-center">
                                                    {subItem.label === "Danh sách bài thi" ? (
                                                        <ListBulletIcon className="w-4 h-4" />
                                                    ) : subItem.label === "Tạo bài thi" ? (
                                                        <PlusCircleIcon className="w-4 h-4" />
                                                    ) : (
                                                        <DocumentTextIcon className="w-4 h-4" />
                                                    )}
                                                </span>
                                                <span>{subItem.label}</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={(e) => handleNavigation(item.href, e)}
                            className={`flex items-center rounded-lg px-3 py-2 transition-colors duration-150 ${isCurrentActive
                                ? 'bg-zinc-100 text-purple-700 font-semibold'
                                : 'hover:bg-zinc-50'
                                }`}
                        >
                            {getIcon(item.label)}
                            <span className="ml-3">{item.label}</span>
                        </a>
                    );
                })}
            </nav>
        </aside>
    );
};

/** @type {React.FC} */
const TeacherTopBar = () => {
    return (
        <header className="w-full border-b border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 md:py-3">
                <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-zinc-800">Bảng điều khiển Giáo viên</h1>
                </div>

                <div className="flex-1"></div>

                <ProfileDropdown />

            </div>
        </header>
    );
};

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TeacherAuthGuard>
            <div className="flex min-h-screen bg-gray-50">
                <TeacherSidebar />
                <div className="ml-64 flex flex-col flex-1 transition-[margin-left] duration-300 w-[calc(100%-16rem)]">
                    <TeacherTopBar />
                    <main className="flex-1 pb-10 bg-gray-50 w-full">
                        {children}
                    </main>
                    <footer className="mt-auto bg-[#F5F5F5] border-t border-gray-200 py-4 text-center text-gray-500 text-sm">
                        &copy; 2025 QuizzZone. Mọi quyền được bảo lưu.
                    </footer>
                </div>
            </div>
        </TeacherAuthGuard>
    );
}
