"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import Swal from "sweetalert2";
import {
    Trophy, Clock, Users, Loader2, LogOut, StopCircle,
    Search, TrendingUp, Award, BarChart3
} from "lucide-react";

interface LiveProgress {
    studentId: number;
    displayName: string;
    avatarUrl: string;
    questionsAnswered: number;
    totalQuestions: number;
    currentScore: number;
    timeSpent: number; // seconds
}

interface ExamInfo {
    id: number;
    name: string;
    status: string;
    durationMinutes: number;
    maxParticipants: number;
    startedAt: string;
}

export default function TeacherMonitorPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<ExamInfo | null>(null);
    const [participants, setParticipants] = useState<LiveProgress[]>([]);
    const [isFinishing, setIsFinishing] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch exam info
    useEffect(() => {
        if (!examId) return;

        const fetchExamInfo = async () => {
            try {
                const data = await fetchApi(`/online-exams/${examId}`);
                setExam(data);

                // Calculate elapsed time
                if (data.startedAt) {
                    const start = new Date(data.startedAt).getTime();
                    const now = Date.now();
                    setElapsedTime(Math.floor((now - start) / 1000));
                }
            } catch (error: any) {
                console.error("Failed to load exam:", error);
                toastError(error.message || "Không thể tải thông tin bài thi");
                router.push("/admin/list-exam");
            } finally {
                setLoading(false);
            }
        };

        fetchExamInfo();
    }, [examId, router]);

    // Poll live progress every 5 seconds
    useEffect(() => {
        if (!examId || loading) return;

        const fetchProgress = async () => {
            try {
                const data = await fetchApi(`/online-exams/${examId}/live-progress`);
                setParticipants(data || []);
            } catch (error: any) {
                console.error("Failed to fetch progress:", error);
            }
        };

        fetchProgress(); // Initial fetch

        const interval = setInterval(fetchProgress, 5000);
        return () => clearInterval(interval);
    }, [examId, loading]);

    // Update elapsed time every second
    useEffect(() => {
        if (!exam?.startedAt) return;

        const interval = setInterval(() => {
            const start = new Date(exam.startedAt).getTime();
            const now = Date.now();
            setElapsedTime(Math.floor((now - start) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [exam]);

    const handleFinishExam = async () => {
        if (!exam) return;

        const result = await Swal.fire({
            title: 'Kết thúc bài thi?',
            html: `Bạn có chắc chắn muốn kết thúc bài thi <strong>"${exam.name}"</strong>?<br/>Tất cả học sinh sẽ tự động nộp bài.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Kết thúc',
            cancelButtonText: 'Hủy',
        });
        if (!result.isConfirmed) return;

        setIsFinishing(true);
        try {
            await fetchApi(`/online-exams/${examId}/finish`, { method: "POST" });
            toastSuccess("Đã kết thúc bài thi!");
            setTimeout(() => {
                router.push(`/admin/exam-online/${examId}/results`);
            }, 1500);
        } catch (error: any) {
            console.error("Failed to finish exam:", error);
            toastError(error.message || "Không thể kết thúc bài thi");
            setIsFinishing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    // Derived stats
    const leaderboard = useMemo(() => {
        return [...participants].sort((a, b) => {
            if (b.currentScore !== a.currentScore) return b.currentScore - a.currentScore;
            if (b.questionsAnswered !== a.questionsAnswered) return b.questionsAnswered - a.questionsAnswered;
            return a.timeSpent - b.timeSpent;
        });
    }, [participants]);

    const filteredLeaderboard = useMemo(() => {
        return leaderboard.filter(p =>
            p.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [leaderboard, searchTerm]);

    const topScore = leaderboard.length > 0 ? leaderboard[0].currentScore : 0;
    const avgProgress = participants.length > 0
        ? Math.round(participants.reduce((acc, p) => acc + (p.questionsAnswered / p.totalQuestions) * 100, 0) / participants.length)
        : 0;

    const getRankBadge = (index: number) => {
        if (index === 0) return "🥇";
        if (index === 1) return "🥈";
        if (index === 2) return "🥉";
        return `#${index + 1}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-600 gap-4">
                <Loader2 className="animate-spin" size={48} />
                <span className="text-lg font-medium">Đang tải dữ liệu phòng thi...</span>
            </div>
        );
    }

    if (!exam) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header / Navbar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 hidden sm:block">
                                <BarChart3 size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{exam.name}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Đang diễn ra</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push("/admin/list-exam")}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Thoát</span>
                            </button>
                            <button
                                onClick={handleFinishExam}
                                disabled={isFinishing}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm hover:shadow font-medium text-sm transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isFinishing ? <Loader2 className="animate-spin w-4 h-4" /> : <StopCircle size={18} />}
                                {isFinishing ? "Đang xử lý..." : "Kết thúc Bài Thi"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Time Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock size={64} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Thời gian trôi qua</p>
                            <h3 className="text-3xl font-bold text-gray-900 font-mono tracking-tight">
                                {formatTime(elapsedTime)}
                            </h3>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-xs text-gray-400">
                            Thời lượng: {exam.durationMinutes} phút
                        </div>
                    </div>

                    {/* Participants Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users size={64} className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Sĩ số lớp</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-gray-900">{participants.length}</h3>
                                <span className="text-sm text-gray-400">/ {exam.maxParticipants}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${(participants.length / exam.maxParticipants) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Avg Progress Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp size={64} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Tiến độ trung bình</p>
                            <h3 className="text-3xl font-bold text-gray-900">{avgProgress}%</h3>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${avgProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Top Score Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Award size={64} className="text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Điểm cao nhất</p>
                            <h3 className="text-3xl font-bold text-gray-900 text-yellow-600">{topScore.toFixed(1)}</h3>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-1 text-xs text-gray-400">
                            <Trophy size={14} className="text-yellow-500" /> Dẫn đầu BXH
                        </div>
                    </div>
                </div>

                {/* Main Content: Leaderboard */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Trophy className="text-yellow-500" size={20} />
                                Bảng xếp hạng trực tiếp
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Cập nhật tự động mỗi 5 giây</p>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm học sinh..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Hạng</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Học sinh</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Tiến độ làm bài</th>
                                    <th className="py-4 px-6 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Điểm số</th>
                                    <th className="py-4 px-6 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLeaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users size={48} className="mb-3 opacity-20" />
                                                <p>Chưa có dữ liệu học sinh</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeaderboard.map((p, index) => {
                                        const progressPercent = p.totalQuestions > 0 ? (p.questionsAnswered / p.totalQuestions) * 100 : 0;
                                        const isTop3 = index < 3;

                                        return (
                                            <tr key={p.studentId} className={`hover:bg-gray-50 transition-colors ${isTop3 ? 'bg-yellow-50/30' : ''}`}>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg ${index === 0 ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-400 ring-opacity-50' :
                                                            index === 1 ? 'bg-gray-100 text-gray-600 ring-2 ring-gray-400 ring-opacity-50' :
                                                                index === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-400 ring-opacity-50' :
                                                                    'text-gray-500 bg-gray-100 text-sm'
                                                        }`}>
                                                        {index < 3 ? getRankBadge(index) : `#${index + 1}`}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-sm">
                                                            <img
                                                                src={p.avatarUrl || `https://ui-avatars.com/api/?name=${p.displayName}&background=random`}
                                                                alt={p.displayName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{p.displayName}</p>
                                                            <p className="text-xs text-gray-500 hidden sm:block">ID: {p.studentId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="font-medium text-gray-700">{p.questionsAnswered} / {p.totalQuestions} câu</span>
                                                            <span className="text-gray-500">{Math.round(progressPercent)}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-700 ease-out ${progressPercent === 100 ? 'bg-green-500' : 'bg-indigo-500'
                                                                    }`}
                                                                style={{ width: `${progressPercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold">
                                                        {p.currentScore.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono text-gray-600 text-sm">
                                                    {formatTime(p.timeSpent)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
