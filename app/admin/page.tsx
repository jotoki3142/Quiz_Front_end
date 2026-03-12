"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUser } from "@/lib/user";
import { fetchApi } from "@/lib/apiClient";
import StatCard from "@/components/admin/StatCard";
import {
    UsersIcon,
    AcademicCapIcon,
    ClipboardDocumentCheckIcon,
    UserPlusIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function AdminHome() {
    const { user } = useUser();
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        pendingTeachers: 0,
        exams: 0,
    });
    const [loading, setLoading] = useState(true);
    const [roomCode, setRoomCode] = useState("");

    const getCount = (res: any) => {
        if (!res) return 0;
        if (Array.isArray(res)) return res.length;
        if (typeof res === 'number') return res;
        if (res.total && typeof res.total === 'number') return res.total;
        if (Array.isArray(res.content)) return res.content.length;
        if (Array.isArray(res.data)) return res.data.length;
        if (res && typeof res === 'object') return Object.keys(res).length;
        return 0;
    };

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [studentsRes, teachersRes, pendingRes, examsRes] = await Promise.all([
                    fetchApi("/admin/accounts/students"),
                    fetchApi("/admin/accounts/teachers"),
                    fetchApi("/admin/teachers/pending"),
                    fetchApi("/exams/all"),
                ]);

                setStats({
                    students: getCount(studentsRes),
                    teachers: getCount(teachersRes),
                    pendingTeachers: getCount(pendingRes),
                    exams: getCount(examsRes),
                });
            } catch (error) {
                console.error("Failed to load stats", error);
                toast.error("Không thể tải thống kê");
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const handleJoinRoom = () => {
        if (!roomCode.trim()) {
            toast.error("Vui lòng nhập mã phòng");
            return;
        }
        toast.success(`Đang tham gia phòng ${roomCode}`);
        // Add logic to navigate or join room here
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-lg">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold">
                        Xin chào, {user?.lastName || "Admin"}! 👋
                    </h2>
                    <p className="mt-2 text-violet-100 max-w-2xl">
                        Chào mừng trở lại bảng điều khiển. Đây là tổng quan về hoạt động của hệ thống ngày hôm nay.
                    </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform blur-2xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Tổng học sinh"
                    value={stats.students}
                    icon={UsersIcon}
                    color="blue"
                    isLoading={loading}
                />
                <StatCard
                    title="Tổng giáo viên"
                    value={stats.teachers}
                    icon={AcademicCapIcon}
                    color="emerald"
                    isLoading={loading}
                />
                <StatCard
                    title="Giáo viên chờ duyệt"
                    value={stats.pendingTeachers}
                    icon={UserPlusIcon}
                    color="orange"
                    isLoading={loading}
                    trend={stats.pendingTeachers > 0 ? { value: stats.pendingTeachers, isPositive: true } : undefined}
                />
                <StatCard
                    title="Tổng bài thi"
                    value={stats.exams}
                    icon={ClipboardDocumentCheckIcon}
                    color="violet"
                    isLoading={loading}
                />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Quick Actions */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 lg:col-span-1 h-fit">
                    <h3 className="text-lg font-bold text-zinc-900 mb-4">Tác vụ nhanh</h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-zinc-50 rounded-xl">
                            <label className="text-sm font-medium text-zinc-700 block mb-2">
                                Tham gia phòng thi nhanh
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    placeholder="Nhập mã phòng..."
                                    className="w-full rounded-lg border-zinc-200 text-sm focus:border-violet-500 focus:ring-violet-500"
                                />
                                <button
                                    onClick={handleJoinRoom}
                                    className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                                >
                                    Vào
                                </button>
                            </div>
                        </div>

                        <Link
                            href="/admin/approve-teachers"
                            className="flex items-center justify-between p-4 bg-orange-50 rounded-xl group cursor-pointer hover:bg-orange-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-orange-600">
                                    <UserPlusIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-orange-900">Duyệt giáo viên</p>
                                    <p className="text-xs text-orange-700"> {stats.pendingTeachers} yêu cầu đang chờ</p>
                                </div>
                            </div>
                            <ArrowRightIcon className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="/admin/exam-online"
                            className="flex items-center justify-between p-4 bg-violet-50 rounded-xl group cursor-pointer hover:bg-violet-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-violet-600">
                                    <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-violet-900">Tạo bài thi mới</p>
                                    <p className="text-xs text-violet-700">Thiết lập bài thi online</p>
                                </div>
                            </div>
                            <ArrowRightIcon className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Recent Activity Placeholder (Can be expanded later) */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-zinc-900">Hoạt động gần đây</h3>
                        <button className="text-sm font-medium text-violet-600 hover:text-violet-700">
                            Xem tất cả
                        </button>
                    </div>

                    <div className="text-center py-12">
                        <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardDocumentCheckIcon className="w-8 h-8 text-zinc-300" />
                        </div>
                        <p className="text-zinc-500">Chưa có hoạt động nào được ghi nhận gần đây.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

