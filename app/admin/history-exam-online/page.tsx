"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError } from "@/lib/toast";
import {
    MagnifyingGlassIcon,
    UsersIcon,
    ChartBarIcon,
    CalendarIcon,
    EyeIcon,
    CloudIcon,
    ArrowRightIcon,
    FunnelIcon,
} from "@heroicons/react/24/outline";

interface FinishedExam {
    id: number;
    name: string;
    finishedAt: string;
    totalSubmissions: number;
    averageScore: number;
}

export default function AdminExamHistoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<FinishedExam[]>([]);

    // Search State (Visual/Client-side filtering)
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        const fetchFinishedExams = async () => {
            try {
                setLoading(true);
                // Fetch all exams (Admin sees all)
                const allExams = await fetchApi("/online-exams/all");

                // Filter only FINISHED exams
                const finishedExams = allExams.filter((exam: any) => exam.status === "FINISHED");

                // For each exam, fetch submission count
                const examsWithStats = await Promise.all(
                    finishedExams.map(async (exam: any) => {
                        try {
                            const histories = await fetchApi(`/examHistory/online-exam/${exam.id}`);
                            const totalSubmissions = histories.length;
                            const averageScore = totalSubmissions > 0
                                ? histories.reduce((sum: number, h: any) => sum + h.score, 0) / totalSubmissions
                                : 0;

                            return {
                                id: exam.id,
                                name: exam.name,
                                finishedAt: exam.finishedAt,
                                totalSubmissions,
                                averageScore,
                            };
                        } catch {
                            return {
                                id: exam.id,
                                name: exam.name,
                                finishedAt: exam.finishedAt,
                                totalSubmissions: 0,
                                averageScore: 0,
                            };
                        }
                    })
                );

                setExams(examsWithStats);
            } catch (error: any) {
                console.error("Failed to load finished exams:", error);
                toastError(error.message || "Không thể tải lịch sử bài thi");
            } finally {
                setLoading(false);
            }
        };

        fetchFinishedExams();
    }, []);

    // Filter logic
    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });


    return (
        <div className="min-h-screen">
            <div className="space-y-6">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-xl shadow-violet-200 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black/10 blur-3xl"></div>

                    <div className="relative p-8 text-white">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                    <CloudIcon className="w-10 h-10 text-violet-200" />
                                    Lịch sử thi Online
                                </h1>
                                <p className="text-violet-100 mt-2 text-lg opacity-90 max-w-2xl">
                                    Thống kê chi tiết và kết quả của các kỳ thi trực tuyến đã kết thúc.
                                </p>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="flex p-1 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                                <button onClick={() => router.push("/admin/list-exam")} className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all text-sm font-medium">
                                    Bài thi
                                </button>
                                <button onClick={() => router.push("/admin/history-exam")} className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all text-sm font-medium">
                                    Lịch sử Offline
                                </button>
                                <button onClick={() => router.push("/admin/history-exam-online")} className="px-4 py-2 rounded-lg bg-white text-violet-700 font-bold shadow-sm transition-all text-sm">
                                    Lịch sử Online
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="mt-8 p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1 min-w-[200px] group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                </div>
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm theo tên bài thi..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm font-medium shadow-sm"
                                />
                            </div>

                            <div className="flex flex-1 gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-xs font-semibold text-zinc-500">Từ:</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium shadow-sm"
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-xs font-semibold text-zinc-500">Đến:</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium shadow-sm"
                                    />
                                </div>
                                <button className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 flex items-center gap-2">
                                    <FunnelIcon className="w-4 h-4" /> Lọc
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm min-h-[500px] p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4"></div>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredExams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50">
                            <CloudIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-medium text-zinc-500">Chưa có bài thi online nào kết thúc.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredExams.map((exam) => (
                                <HistoryOnlineCard key={exam.id} exam={exam} onDetail={() => router.push(`/admin/exam-online/${exam.id}/results`)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Sub Components ---

const HistoryOnlineCard = ({ exam, onDetail }: { exam: FinishedExam, onDetail: () => void }) => {
    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-lg transition-all hover:border-violet-200 group flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-100">
                    Đã kết thúc
                </span>
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <EyeIcon className="w-5 h-5" />
                </div>
            </div>

            <h3 className="font-bold text-zinc-900 text-lg mb-4 line-clamp-2" title={exam.name}>
                {exam.name}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-xl bg-zinc-50 flex flex-col items-center justify-center border border-zinc-100">
                    <span className="text-2xl font-black text-zinc-800">{exam.totalSubmissions}</span>
                    <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 mt-1">
                        <UsersIcon className="w-3 h-3" /> Bài nộp
                    </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 flex flex-col items-center justify-center border border-zinc-100">
                    <span className="text-2xl font-black text-violet-600">{exam.averageScore.toFixed(1)}</span>
                    <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 mt-1">
                        <ChartBarIcon className="w-3 h-3" /> Điểm TB
                    </span>
                </div>
            </div>

            <div className="mt-auto space-y-4">
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 pt-4 border-t border-zinc-50">
                    <CalendarIcon className="w-3 h-3" />
                    Kết thúc: {exam.finishedAt ? new Date(exam.finishedAt).toLocaleDateString("vi-VN") : "---"}
                </div>

                <button
                    onClick={onDetail}
                    className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200 active:scale-95"
                >
                    Xem chi tiết <ArrowRightIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
