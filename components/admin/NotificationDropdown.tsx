"use client";
import React, { useState, useRef, useEffect } from "react";
import { BellIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

type NotificationType = "info" | "success" | "warning" | "error";

interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    type: NotificationType;
    isRead: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 1,
        title: "Hệ thống bảo trì",
        message: "Hệ thống sẽ bảo trì định kỳ vào lúc 22:00 hôm nay. Vui lòng lưu dữ liệu.",
        time: "5 phút trước",
        type: "warning",
        isRead: false,
    },
    {
        id: 2,
        title: "Giáo viên mới đăng ký",
        message: "Giáo viên Nguyễn Văn A vừa gửi yêu cầu đăng ký tài khoản.",
        time: "30 phút trước",
        type: "info",
        isRead: false,
    },
    {
        id: 3,
        title: "Bài thi hoàn thành",
        message: "Bài thi 'Kiểm tra 15 phút' đã kết thúc. Có 45 học sinh tham gia.",
        time: "2 giờ trước",
        type: "success",
        isRead: true,
    },
    {
        id: 4,
        title: "Lỗi hệ thống",
        message: "Phát hiện lỗi kết nối đến máy chủ lưu trữ ảnh.",
        time: "1 ngày trước",
        type: "error",
        isRead: true,
    },
];

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
    const ref = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case "success": return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />;
            case "warning": return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
            case "error": return <XMarkIcon className="w-5 h-5 text-rose-500" />;
            default: return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBgColor = (type: NotificationType) => {
        switch (type) {
            case "success": return "bg-emerald-50";
            case "warning": return "bg-amber-50";
            case "error": return "bg-rose-50";
            default: return "bg-blue-50";
        }
    };

    const filteredNotifications = activeTab === "all"
        ? notifications
        : notifications.filter((n) => !n.isRead);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-zinc-400 rounded-full hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
                title="Thông báo"
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-zinc-100 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-zinc-900">Thông báo</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                                >
                                    Đánh dấu đã đọc
                                </button>
                            )}
                        </div>
                        <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg">
                            <button
                                onClick={() => setActiveTab("unread")}
                                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${activeTab === "unread"
                                        ? "bg-white text-zinc-900 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700"
                                    }`}
                            >
                                Chưa đọc
                            </button>
                            <button
                                onClick={() => setActiveTab("all")}
                                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${activeTab === "all"
                                        ? "bg-white text-zinc-900 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700"
                                    }`}
                            >
                                Tất cả
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                <BellIcon className="w-12 h-12 mx-auto mb-3 text-zinc-200" />
                                <p>Không có thông báo {activeTab === "unread" ? "chưa đọc" : ""} nào</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-50">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-zinc-50 transition-colors relative ${!notification.isRead ? "bg-violet-50/30" : ""
                                            }`}
                                    >
                                        <div className="flex gap-3 items-start">
                                            <div className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${getBgColor(notification.type)}`}>
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${!notification.isRead ? "text-zinc-900" : "text-zinc-600"}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                                                    {notification.time}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2"></span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 text-center">
                        <button className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors">
                            Xem tất cả thông báo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

