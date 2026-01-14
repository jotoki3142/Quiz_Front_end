"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    HomeIcon,
    UsersIcon,
    CheckBadgeIcon,
    FolderIcon,
    ChevronDownIcon,
    AcademicCapIcon,
    UserIcon,
    ClipboardDocumentListIcon,
    ListBulletIcon,
    PlusCircleIcon,
    QuestionMarkCircleIcon,
    Bars3Icon,
} from "@heroicons/react/24/outline";

interface NavItem {
    name: string;
    href: string;
    icon?: React.ReactNode;
    submenu?: NavItem[];
}

const navItems: NavItem[] = [
    { name: "Trang chủ", href: "/admin", icon: <HomeIcon className="w-5 h-5" /> },
    {
        name: "Quản lý tài khoản",
        href: "/admin/accounts",
        icon: <UsersIcon className="w-5 h-5" />,
        submenu: [
            { name: "Giáo viên", href: "/admin/accounts/teachers" },
            { name: "Học sinh", href: "/admin/accounts/students" },
        ],
    },
    {
        name: "Duyệt giáo viên",
        href: "/admin/approve-teachers",
        icon: <CheckBadgeIcon className="w-5 h-5" />,
    },
    {
        name: "Quản lý bài thi",
        href: "/admin/exams",
        icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
        submenu: [
            { name: "Danh sách bài thi", href: "/admin/list-exam" },
            { name: "Tạo bài thi", href: "/admin/exam-online" },
        ],
    },
    { name: "Danh mục", href: "/admin/categories", icon: <FolderIcon className="w-5 h-5" /> },
    { name: "Câu hỏi", href: "/admin/questions", icon: <QuestionMarkCircleIcon className="w-5 h-5" /> },
];

export default function AdminSidebar({
    isMobileOpen,
    onCloseMobile,
}: {
    isMobileOpen?: boolean;
    onCloseMobile?: () => void;
}) {
    const pathname = usePathname();
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    const toggleSubmenu = (name: string) => {
        setExpandedMenus((prev) =>
            prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
        );
    };

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={onCloseMobile}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 overflow-y-auto border-r border-zinc-200
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
            >
                <div className="flex items-center justify-between p-6">
                    <Link href="/admin" className="flex items-center gap-2">
                        <span className="text-2xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                            QuizzZone
                        </span>
                    </Link>
                    <button onClick={onCloseMobile} className="lg:hidden p-1 rounded-md hover:bg-zinc-100">
                        <Bars3Icon className="w-6 h-6 text-zinc-600" />
                    </button>
                </div>

                <nav className="px-4 pb-6 space-y-1">
                    {navItems.map((item) => {
                        const isExpanded = expandedMenus.includes(item.name) || isActive(item.href);
                        const isCurrent = isActive(item.href);

                        return (
                            <div key={item.name} className="flex flex-col">
                                {item.submenu ? (
                                    <>
                                        <button
                                            onClick={() => toggleSubmenu(item.name)}
                                            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${isCurrent || isExpanded ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"}
                      `}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.icon}
                                                <span>{item.name}</span>
                                            </div>
                                            <ChevronDownIcon
                                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>
                                        {isExpanded && (
                                            <div className="mt-1 ml-4 pl-3 border-l-2 border-zinc-100 space-y-1 relative">
                                                {item.submenu.map((sub) => {
                                                    const subActive = isActive(sub.href);
                                                    return (
                                                        <Link
                                                            key={sub.name}
                                                            href={sub.href}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                                ${subActive ? "text-violet-600 font-semibold bg-violet-50" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}
                              `}
                                                        >
                                                            {sub.name === "Tạo bài thi" && <PlusCircleIcon className="w-4 h-4" />}
                                                            {sub.name === "Danh sách bài thi" && <ListBulletIcon className="w-4 h-4" />}
                                                            {sub.name === "Giáo viên" && <AcademicCapIcon className="w-4 h-4" />}
                                                            {sub.name === "Học sinh" && <UserIcon className="w-4 h-4" />}
                                                            <span>{sub.name}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isCurrent ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"}
                    `}
                                    >
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
