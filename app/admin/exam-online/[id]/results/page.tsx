"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError } from "@/lib/toast";
import {
    Trophy, Users, TrendingUp, Clock, Home, Loader2,
    CheckCircle, XCircle, Search, Download, BarChart2,
    Calendar, ArrowUpRight
} from "lucide-react";
import Swal from "sweetalert2";

interface StudentResult {
    id: number;
    studentName: string;
    avatarUrl?: string; // Mock or add if backend supports
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeSpent: number;
    passed: boolean;
    submittedAt: string;
}

interface ExamInfo {
    id: number;
    name: string;
    maxParticipants: number;
    durationMinutes: number;
    startedAt: string;
}

export default function TeacherResultsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<StudentResult[]>([]);
    const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!examId) return;

        const fetchResults = async () => {
            try {
                setLoading(true);

                // Fetch exam info
                const exam = await fetchApi(`/online-exams/${examId}`);
                setExamInfo(exam);

                // Fetch all exam history for this exam
                const histories = await fetchApi(`/examHistory/online-exam/${examId}`);

                // Transform to StudentResult format
                const studentResults: StudentResult[] = histories.map((h: any) => ({
                    id: h.id,
                    studentName: h.displayName || h.studentName,
                    avatarUrl: h.avatarUrl,
                    score: h.score,
                    correctCount: h.correctCount,
                    totalQuestions: h.totalQuestions,
                    timeSpent: h.timeSpent || 0,
                    passed: h.passed,
                    submittedAt: h.submittedAt,
                }));

                // Sort by score DESC
                studentResults.sort((a, b) => b.score - a.score);
                setResults(studentResults);
            } catch (error: any) {
                console.error("Failed to load results:", error);
                toastError(error.message || "Không thể tải kết quả");
                router.push("/admin/list-exam");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [examId, router]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}p ${String(secs).padStart(2, "0")}s`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const totalSubmissions = results.length;
        if (totalSubmissions === 0) return {
            totalSubmissions: 0,
            averageScore: 0,
            passRate: 0,
            highestScore: 0,
            avgTime: 0,
            scoreDistribution: [0, 0, 0, 0, 0]
        };

        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const passedCount = results.filter((r) => r.passed).length;
        const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);
        const maxScore = Math.max(...results.map((r) => r.score));

        // Score Distribution: 0-2, 2-4, 4-6, 6-8, 8-10
        const distribution = [0, 0, 0, 0, 0];
        results.forEach(r => {
            const bucket = Math.min(Math.floor(r.score / 2), 4);
            // Handle edge case where score is exactly 10 (or max), bucket might be 5 if we did floor(10/2). 
            // 10/2 = 5 -> index 4 (8-10 range usually includes 10)
            // If score is 10, bucket is 5. We want it in index 4.
            const index = r.score === 10 ? 4 : Math.min(Math.floor(r.score / 2), 4);
            // Safety check
            if (index >= 0 && index < 5) distribution[index]++;
        });

        return {
            totalSubmissions,
            averageScore: totalScore / totalSubmissions,
            passRate: (passedCount / totalSubmissions) * 100,
            highestScore: maxScore,
            avgTime: totalTime / totalSubmissions,
            scoreDistribution: distribution
        };
    }, [results]);

    const filteredResults = useMemo(() => {
        return results.filter(r =>
            r.studentName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [results, searchTerm]);

    const handleExport = () => {
        // Placeholder for CSV export
        Swal.fire({
            title: 'Tính năng đang phát triển',
            text: 'Chức năng xuất báo cáo CSV sẽ sớm được cập nhật!',
            icon: 'info',
            confirmButtonColor: '#7c3aed'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-600 gap-4">
                <Loader2 className="animate-spin" size={48} />
                <span className="text-lg font-medium">Đang tổng hợp kết quả...</span>
            </div>
        );
    }

    if (!examInfo) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                    Kết Quả Bài Thi
                                </span>
                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                    <Calendar size={12} />
                                    {formatDate(examInfo.startedAt)}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">{examInfo.name}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExport}
                                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm font-medium text-sm transition flex items-center gap-2"
                            >
                                <Download size={18} />
                                Xuất CSV
                            </button>
                            <button
                                onClick={() => router.push("/admin/list-exam")}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium text-sm transition flex items-center gap-2"
                            >
                                <Home size={18} />
                                Về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Submissions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Users size={64} className="text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-gray-500 mb-1">Tổng Số Bài Nộp</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</h3>
                                <span className="text-xs font-medium text-gray-400">/ {examInfo.maxParticipants}</span>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-green-600 font-medium bg-green-50 w-fit px-2 py-1 rounded-full">
                                <CheckCircle size={12} className="mr-1" />
                                {stats.totalSubmissions > 0 ? "100% Hoàn thành" : "Chưa có bài nộp"}
                            </div>
                        </div>
                    </div>

                    {/* Average Score */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp size={64} className="text-purple-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-gray-500 mb-1">Điểm Trung Bình</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}</h3>
                            <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-purple-600 h-1.5 rounded-full"
                                    style={{ width: `${(stats.averageScore / 10) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Pass Rate */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <CheckCircle size={64} className="text-green-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-gray-500 mb-1">Tỷ Lệ Đậu</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.passRate.toFixed(1)}%</h3>
                            <div className="mt-4 flex items-center gap-2 text-xs">
                                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center">
                                    <ArrowUpRight size={12} className="mr-1" /> Tốt
                                </span>
                                <span className="text-gray-400">trên tổng số</span>
                            </div>
                        </div>
                    </div>

                    {/* Time Analysis */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Clock size={64} className="text-orange-600" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-gray-500 mb-1">Thời Gian Làm Bài TB</p>
                            <h3 className="text-3xl font-bold text-gray-900">{formatTime(stats.avgTime)}</h3>
                            <div className="mt-4 text-xs text-gray-500">
                                Giới hạn: {examInfo.durationMinutes} phút
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Score Distribution Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart2 size={20} className="text-indigo-600" />
                            Phân Bố Điểm Số
                        </h3>

                        <div className="flex items-stretch justify-between h-48 gap-2 pt-4">
                            {stats.scoreDistribution.map((count, idx) => {
                                const maxCount = Math.max(...stats.scoreDistribution) || 1;
                                const heightPercent = (count / maxCount) * 100;
                                const ranges = ["0-2", "2-4", "4-6", "6-8", "8-10"];
                                const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-green-400"];

                                return (
                                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group justify-end">
                                        <div className="relative w-full flex-1 flex justify-center items-end">
                                            <div
                                                className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${colors[idx]} opacity-80 group-hover:opacity-100`}
                                                style={{ height: `${heightPercent}%` }}
                                            ></div>
                                            <span className="absolute -top-6 text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {count}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">{ranges[idx]}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-4">Biểu đồ thể hiện số lượng học sinh theo thang điểm</p>
                    </div>

                    {/* Results Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Users size={20} className="text-indigo-600" />
                                Danh Sách Chi Tiết
                            </h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Tìm học sinh..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Học sinh</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm số</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày nộp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredResults.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <Users size={40} className="text-gray-300 mb-2" />
                                                    <p>Không tìm thấy kết quả</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredResults.map((result) => (
                                            <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm overflow-hidden">
                                                            {result.avatarUrl ? (
                                                                <img src={result.avatarUrl} alt={result.studentName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                result.studentName.charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{result.studentName}</p>
                                                            <p className="text-xs text-gray-500">ID: {result.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {result.passed ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <CheckCircle size={12} className="mr-1" /> Đạt
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            <XCircle size={12} className="mr-1" /> Rớt
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="font-bold text-gray-900">{result.score}</span>
                                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${result.passed ? 'bg-green-500' : 'bg-red-400'}`}
                                                                style={{ width: `${(result.score / 10) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-gray-400">{result.correctCount}/{result.totalQuestions} câu đúng</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-gray-600 font-mono">
                                                    {formatTime(result.timeSpent)}
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs text-gray-500">
                                                    {new Date(result.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <br />
                                                    {new Date(result.submittedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
