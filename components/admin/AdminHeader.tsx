"use client";
import React, { useEffect } from "react";
import ProfileDropdown from "@/components/ProfileDropdown";
import NotificationDropdown from "@/components/admin/NotificationDropdown";
import {
    Bars3Icon,
    MagnifyingGlassIcon,
    QuestionMarkCircleIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface AdminHeaderProps {
    onMenuClick: () => void;
    title: string;
}

export default function AdminHeader({ onMenuClick, title }: AdminHeaderProps) {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                document.querySelector("input")?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleHelpClick = () => {
        toast("Trung tâm trợ giúp sẽ sớm ra mắt!", {
            icon: '💡',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
    };

    return (
        <header className="sticky top-0 z-30 px-6 py-4 bg-white/90 backdrop-blur-xl shadow-sm border-b border-zinc-200/80 transition-all duration-200 lg:px-8">
            <div className="flex items-center justify-between gap-4">

                {/* Left: Mobile Menu + Title */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 -ml-2 text-zinc-500 rounded-xl hover:bg-zinc-100 lg:hidden transition-colors"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h1>
                        <p className="text-xs text-zinc-500 font-medium hidden sm:block">
                            {new Date().toLocaleDateString("vi-VN", {
                                weekday: "long",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                </div>

                {/* Center: Search Bar (Hidden on mobile, visible on lg) */}
                <div className="hidden md:flex flex-1 max-w-md mx-6">
                    <div className="relative w-full group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full p-2.5 pl-10 text-sm text-zinc-900 bg-zinc-50 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 placeholder:text-zinc-400"
                            placeholder="Tìm kiếm..."
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-xs text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5 shadow-sm">Ctrl K</span>
                        </div>
                    </div>
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleHelpClick}
                            className="p-2 text-zinc-400 rounded-full hover:bg-zinc-50 hover:text-zinc-700 transition-colors hidden sm:block tooltip tooltip-bottom"
                            title="Trợ giúp"
                        >
                            <QuestionMarkCircleIcon className="w-6 h-6" />
                        </button>
                        <NotificationDropdown />
                    </div>

                    <div className="w-px h-8 bg-zinc-200 hidden sm:block"></div>

                    <ProfileDropdown />
                </div>

            </div>
        </header>
    );
}
