"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";
import {
    MagnifyingGlassIcon,
    CalendarIcon,
    FunnelIcon,
    ArrowLeftIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/solid";

interface ExamHistory {
    id: number;
    studentId: number;
    displayName: string;
    studentAvatar?: string;
    submittedAt: string;
    attemptNumber: number;
    correctCount: number;
    totalQuestions: number;
    score: number;
    timeSpent?: string;
}

export default function AdminListHistoryExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const examId = searchParams.get('examId');

    const [histories, setHistories] = useState<ExamHistory[]>([]);
    const [filteredHistories, setFilteredHistories] = useState<ExamHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PASSED, FAILED

    // Fetch Data
    useEffect(() => {
        if (!examId) {
            toast.error("Không tìm thấy ID bài thi");
            router.push("/admin/history-exam");
            return;
        }

        const fetchHistory = async () => {
            try {
                const data = await fetchApi(`/examHistory/get/${examId}`);

                const mapped: ExamHistory[] = Array.isArray(data) ? data.map((h: any) => ({
                    id: h.id,
                    studentId: h.studentId,
                    displayName: h.displayName,
                    studentAvatar: h.studentAvatar,
                    submittedAt: h.submittedAt ? new Date(h.submittedAt).toLocaleString('vi-VN') : '',
                    attemptNumber: h.attemptNumber || 1,
                    correctCount: h.correctCount,
                    totalQuestions: h.totalQuestions,
                    score: h.score,
                    timeSpent: h.timeSpent
                })) : [];

                setHistories(mapped);
                setFilteredHistories(mapped);
            } catch (error) {
                console.error("Fetch history error:", error);
                toast.error("Không thể tải lịch sử làm bài.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [examId, router]);

    // Filtering Logic
    useEffect(() => {
        let result = histories;

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(h =>
                h.displayName.toLowerCase().includes(lowerSearch) ||
                h.id.toString().includes(lowerSearch)
            );
        }

        if (statusFilter !== "ALL") {
            // Assuming passing score is 5 for now if not available in history item
            // Ideally backend should return 'passed' boolean
            // Let's assume >= 5 is passed for visual consistency until refined
            result = result.filter(h => {
                const isPassed = h.score >= 5;
                return statusFilter === "PASSED" ? isPassed : !isPassed;
            });
        }

        setFilteredHistories(result);
    }, [searchTerm, statusFilter, histories]);

    // Pagination (Simple Client Side)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredHistories.length / itemsPerPage);
    const currentData = filteredHistories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">

            {/* Header / Hero Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <ClipboardDocumentListIcon className="w-8 h-8 text-violet-600" />
                                    Lịch sử làm bài
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">Danh sách chi tiết các lượt nộp bài của học sinh</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Xuất báo cáo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Stats Summary (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Tổng lượt thi</p>
                            <p className="text-2xl font-bold text-gray-900">{histories.length}</p>
                        </div>
                    </div>
                    {/* Add more stats if data allows */}
                </div>

                {/* Filters & Controls */}
                <div className="bg-white rounded-t-2xl border border-gray-200 border-b-0 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96 group">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên học sinh..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                            <FunnelIcon className="w-4 h-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-gray-700 font-medium cursor-pointer"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="PASSED">Đạt</option>
                                <option value="FAILED">Chưa đạt</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-b-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    <th className="px-6 py-4 w-16 text-center">STT</th>
                                    <th className="px-6 py-4">Học sinh</th>
                                    <th className="px-6 py-4">Thời gian nộp</th>
                                    <th className="px-6 py-4 text-center">Lượt thi</th>
                                    <th className="px-6 py-4 text-center">Kết quả</th>
                                    <th className="px-6 py-4 text-right">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
                                            <td className="px-6 py-4"><div className="h-10 bg-gray-100 rounded-full w-10 inline-block mr-3"></div><div className="h-4 bg-gray-100 rounded w-32 inline-block"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-12 mx-auto"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded w-16 mx-auto"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded w-20 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : currentData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <ClipboardDocumentListIcon className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <p className="font-medium text-gray-900">Không tìm thấy dữ liệu</p>
                                                <p className="text-sm mt-1">Chưa có lượt thi nào hoặc không khớp bộ lọc</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentData.map((h, index) => {
                                        const isPassed = h.score >= 5; // Placeholder logic
                                        return (
                                            <tr key={h.id} className="group hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 text-center text-sm text-gray-500 font-medium">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-sm overflow-hidden shrink-0">
                                                            {h.studentAvatar ? (
                                                                <img src={h.studentAvatar} alt={h.displayName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                h.displayName.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{h.displayName}</p>
                                                            <p className="text-xs text-gray-500">ID: {h.studentId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-700 font-medium">{h.submittedAt}</span>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <ClockIcon className="w-3 h-3" />
                                                            {h.timeSpent || "-- phút"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600">
                                                        Lần {h.attemptNumber}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="text-lg font-bold text-gray-900">
                                                            <span className={isPassed ? "text-emerald-600" : "text-rose-600"}>{h.score}</span>
                                                            <span className="text-xs text-gray-400 font-normal">/10</span>
                                                        </div>

                                                        {isPassed ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                <CheckCircleIcon className="w-3 h-3" /> Đạt
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                                                <XCircleIcon className="w-3 h-3" /> Rớt
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => router.push(`/admin/history-result/${h.id}`)}
                                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-all shadow-sm"
                                                    >
                                                        Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 relative flex flex-col md:flex-row items-center justify-center gap-4 bg-gray-50/50">
                        <div className="text-sm text-gray-500 md:absolute md:left-6">
                            Hiển thị <span className="font-semibold text-gray-900">{filteredHistories.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> đến <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredHistories.length)}</span> trong số <span className="font-semibold text-gray-900">{filteredHistories.length}</span> kết quả
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                // Logic to show window of pages could be complex, simplifying to show first 5 or logic around current
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 2 + i;
                                }
                                if (pageNum > totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${currentPage === pageNum
                                            ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
