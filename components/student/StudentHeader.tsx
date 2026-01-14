'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProfileDropdown from '@/components/ProfileDropdown';
import {
    HomeIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

export default function StudentHeader() {
    const pathname = usePathname();

    const navItems = [
        { href: '/student/studenthome', label: 'Trang chủ', icon: <HomeIcon className="w-5 h-5" /> },
        { href: '/student/list-exams', label: 'Bài thi', icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
        { href: '/student/history-exam', label: 'Lịch sử', icon: <ClockIcon className="w-5 h-5" /> },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 shadow-sm transition-all duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">

                    {/* Logo */}
                    <Link href="/student/studenthome" className="flex items-center gap-2 group">
                        <div className="bg-gradient-to-br from-fuchsia-500 to-pink-500 p-2 rounded-xl shadow-lg shadow-fuchsia-200 group-hover:scale-105 transition-transform duration-300">
                            <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent tracking-tighter">
                            QuizzZone
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-2 bg-zinc-100/50 p-1.5 rounded-full border border-zinc-200/50">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${isActive(item.href)
                                        ? 'bg-white text-fuchsia-600 shadow-sm ring-1 ring-zinc-200/50'
                                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right mr-2">
                            <p className="text-xs text-zinc-400 font-medium">Học viên</p>
                        </div>
                        <ProfileDropdown />
                    </div>

                </div>
            </div>
        </header>
    );
}
