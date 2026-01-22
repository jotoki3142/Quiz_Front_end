"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";
import StudentLayout from "@/components/StudentLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Calendar,
    Clock,
    Award,
    TrendingUp,
    Filter,
    ChevronLeft,
    ChevronRight,
    FileText,
    Globe,
    Clock3,
    CheckCircle2
} from "lucide-react";

interface ExamHistory {
    id: number;
    examTitle: string;
    submittedAt: string;
    attemptNumber: number;
    score: number;
    wrongCount: number;
    correctCount: number;
    totalQuestions: number;
    examId?: number;
    examOnlineId?: number;
    timeSpent?: number; // accumulated time in seconds if available
}

export default function StudentHistoryPage() {
    const router = useRouter();
    const [histories, setHistories] = useState<ExamHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTitle, setSearchTitle] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [filterType, setFilterType] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const profile = await fetchApi('/me');
                if (!profile || !profile.id) {
                    toast.error("Không xác định được danh tính người dùng.");
                    return;
                }
                const data = await fetchApi(`/examHistory/student/${profile.id}`);
                if (Array.isArray(data)) {
                    // Sort by submittedAt desc by default
                    const sorted = data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
                    setHistories(sorted);
                }
            } catch (error) {
                console.error("Load history error:", error);
                toast.error("Không thể tải lịch sử thi.");
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(0);
    }, [searchTitle, searchDate, filterType]);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        if (histories.length === 0) return { total: 0, avgScore: 0, bestScore: 0, totalTime: 0 };

        const total = histories.length;
        const totalScore = histories.reduce((sum, h) => sum + (h.score || 0), 0);
        const avgScore = (totalScore / total).toFixed(1);
        const bestScore = Math.max(...histories.map(h => h.score || 0));

        return { total, avgScore, bestScore };
    }, [histories]);

    // --- Filter Logic ---
    const filteredHistories = useMemo(() => {
        return histories.filter(h => {
            const matchTitle = h.examTitle ? h.examTitle.toLowerCase().includes(searchTitle.toLowerCase()) : false;
            const dateStr = h.submittedAt ? new Date(h.submittedAt).toISOString().split('T')[0] : '';
            const matchDate = searchDate ? dateStr === searchDate : true;

            let matchType = true;
            if (filterType === "ONLINE") matchType = !!h.examOnlineId;
            if (filterType === "OFFLINE") matchType = !h.examOnlineId;

            return matchTitle && matchDate && matchType;
        });
    }, [histories, searchTitle, searchDate, filterType]);

    // --- Formatting ---
    const formatDate = (isoString: string) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (score >= 5) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-rose-600 bg-rose-50 border-rose-200";
    };

    // --- Pagination ---
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.ceil(filteredHistories.length / ITEMS_PER_PAGE);
    const displayedData = filteredHistories.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans text-slate-800 pb-12">

            {/* HERO SECTION */}
            <div className="relative bg-white overflow-hidden mb-8 border-b border-gray-100 shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                <div className="relative max-w-7xl mx-auto px-6 py-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                                Lịch sử làm bài
                            </h1>
                            <p className="text-slate-500 text-sm md:text-base">
                                Theo dõi quá trình học tập và xem lại kết quả các bài thi của bạn.
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            {[
                                { label: "Tổng số bài thi", value: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
                                { label: "Điểm trung bình", value: stats.avgScore, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
                                { label: "Điểm cao nhất", value: stats.bestScore, icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
                            ].map((stat, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm min-w-[160px]">
                                    <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                        <stat.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                                        <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {/* CONTROLS */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4 justify-between">
                        <div className="flex-1 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên bài thi..."
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all placeholder:text-gray-400 text-sm font-medium"
                                    value={searchTitle}
                                    onChange={(e) => setSearchTitle(e.target.value)}
                                />
                            </div>
                            <div className="relative w-full md:w-48 group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                                <input
                                    type="date"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all text-sm font-medium text-gray-600"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-xl w-full lg:w-auto overflow-x-auto">
                            {[
                                { id: "ALL", label: "Tất cả" },
                                { id: "ONLINE", label: "Online" },
                                { id: "OFFLINE", label: "Luyện tập" }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setFilterType(type.id as any)}
                                    className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${filterType === type.id
                                        ? "bg-white text-violet-600 shadow-sm ring-1 ring-black/5"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LIST CONTENT */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200/60 border-dashed">
                            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
                        </div>
                    ) : displayedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200/60 border-dashed text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                                <FileText size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy bài thi nào</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <AnimatePresence mode="popLayout">
                                {displayedData.map((item, index) => {
                                    const isOnline = !!item.examOnlineId;
                                    const scoreStyle = getScoreColor(item.score);

                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className="group bg-white rounded-2xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-300 relative overflow-hidden"
                                        >
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isOnline ? 'bg-fuchsia-500' : 'bg-blue-500'} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                {/* Exam Type Icon */}
                                                <div className={`hidden md:flex shrink-0 w-14 h-14 rounded-2xl items-center justify-center shadow-inner ${isOnline ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {isOnline ? <Globe size={28} /> : <FileText size={28} />}
                                                </div>

                                                {/* Main Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {isOnline ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-fuchsia-100 text-fuchsia-700 uppercase tracking-wide border border-fuchsia-200">
                                                                <Globe size={10} strokeWidth={3} /> Online
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide border border-blue-200">
                                                                <FileText size={10} strokeWidth={3} /> Luyện tập
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                            <Clock3 size={12} /> {formatDate(item.submittedAt)} • {formatTime(item.submittedAt)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors truncate mb-1">
                                                        {item.examTitle || "Bài thi không tên"}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                                            Lần thi: <span className="font-semibold text-gray-700">{item.attemptNumber}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                            <CheckCircle2 size={13} className="text-emerald-500" />
                                                            Đúng: <span className="font-semibold text-gray-700">{item.correctCount}/{item.totalQuestions}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Score & Actions */}
                                                <div className="flex items-center justify-between w-full md:w-auto gap-6 mt-4 md:mt-0 pl-0 md:pl-6 md:border-l border-gray-100">
                                                    <div className="flex flex-col items-center md:items-end">
                                                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5 tracking-wider">Điểm số</span>
                                                        <div className={`px-4 py-1.5 rounded-xl border ${scoreStyle} font-extrabold text-xl shadow-sm min-w-[3.5rem] text-center`}>
                                                            {item.score ?? "-"}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            const targetPath = item.examOnlineId
                                                                ? `/student/exam-result/${item.id}`
                                                                : `/student/history-exam/${item.id}`;
                                                            router.push(targetPath);
                                                        }}
                                                        className="flex-1 md:flex-none h-11 px-6 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-200 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                                                    >
                                                        Chi tiết
                                                        <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform opacity-70" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-10">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-gray-200 shadow-sm">
                            {Array.from({ length: totalPages }, (_, i) => i).slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 3)).map(i => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-9 h-9 text-sm font-bold rounded-full transition-all flex items-center justify-center ${currentPage === i
                                        ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage === totalPages - 1}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}

