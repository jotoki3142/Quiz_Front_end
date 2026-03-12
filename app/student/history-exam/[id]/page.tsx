"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Calendar,
    ArrowLeft,
    Trophy,
    Target,
    BarChart3,
    AlertCircle,
    Check,
    X
} from "lucide-react";

// --- Interfaces ---
interface StudentAnswerDto {
    questionId: number;
    answerId: number;
    isCorrect: boolean;
}

interface ExamResultDto {
    examHistoryId: number;
    examId: number;
    examTitle: string;
    score: number;
    correctCount: number;
    wrongCount: number;
    totalQuestions: number;
    submittedAt: string;
    studentAnswers: StudentAnswerDto[];
    studentName?: string;
    attemptNumber?: number;
    categoryName?: string;
    timeSpent?: number; // Seconds
    startedAt?: string;
}

interface AnswerOption {
    id: number;
    text: string;
    correct: boolean;
}

interface Question {
    id: number;
    title: string;
    type: string;
    answers: AnswerOption[];
    correctAnswer?: string;
}

interface ExamDetail {
    examId: number;
    title: string;
    durationMinutes: number;
    examLevel: string;
    examQuestions: { question: Question }[];
}

export default function StudentHistoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const historyId = params.id;

    const [history, setHistory] = useState<ExamResultDto | null>(null);
    const [exam, setExam] = useState<ExamDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Map: questionId -> { answerId: isCorrect }
    const [selectedAnswersMap, setSelectedAnswersMap] = useState<Record<number, Record<number, boolean>>>({});

    useEffect(() => {
        if (!historyId) return;

        const loadData = async () => {
            try {
                setLoading(true);

                // 1. Get History Detail
                const historyData: ExamResultDto = await fetchApi(`/examHistory/detail/${historyId}`);
                setHistory(historyData);

                // Map student answers
                const answersMap: Record<number, Record<number, boolean>> = {};
                if (historyData.studentAnswers) {
                    historyData.studentAnswers.forEach(sa => {
                        if (!answersMap[sa.questionId]) {
                            answersMap[sa.questionId] = {};
                        }
                        answersMap[sa.questionId][sa.answerId] = sa.isCorrect;
                    });
                }
                setSelectedAnswersMap(answersMap);

                // 2. Get Exam Detail (Questions)
                if (historyData.examId) {
                    const examData = await fetchApi(`/exams/get/${historyData.examId}`);
                    setExam(examData);
                }

            } catch (error) {
                console.error("Load detail error:", error);
                toast.error("Không thể tải chi tiết lịch sử.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [historyId]);

    const stats = useMemo(() => {
        if (!history) return null;
        const accuracy = Math.round((history.correctCount / history.totalQuestions) * 100) || 0;
        return { accuracy };
    }, [history]);

    // Helpers
    const formatDate = (isoString?: string) => {
        if (!isoString) return "---";
        return new Date(isoString).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds && seconds !== 0) return "---";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}p ${s}s`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return "text-emerald-600";
        if (score >= 5) return "text-amber-600";
        return "text-rose-600";
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium animate-pulse">Đang tải chi tiết bài thi...</p>
        </div>
    );

    if (!history || !exam) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy dữ liệu</h3>
            <p className="text-gray-500 mb-6">Có thể bài thi này không tồn tại hoặc đã bị xóa.</p>
            <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
                Quay lại
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* HERO HEADER */}
            <div className="bg-white border-b border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

                <div className="max-w-5xl mx-auto px-6 py-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 text-sm font-medium group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Quay lại danh sách
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-violet-600 font-semibold text-sm uppercase tracking-wider mb-2">
                                <span className="bg-violet-50 px-2 py-1 rounded-md border border-violet-100">
                                    {history.categoryName || exam.examLevel || "Exam"}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1.5 text-gray-500 normal-case">
                                    <Calendar size={14} /> {formatDate(history.submittedAt)}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 leading-tight">
                                {history.examTitle}
                            </h1>
                            <div className="flex items-center gap-4 text-gray-500 text-sm">
                                <span className="flex items-center gap-1.5 bg-gray-100/50 px-2 py-1 rounded">
                                    <Clock size={14} /> Thời gian làm: <span className="font-medium text-gray-900">{formatDuration(history.timeSpent)}</span>
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-100/50 px-2 py-1 rounded">
                                    <Target size={14} /> Lần thi: <span className="font-medium text-gray-900">{history.attemptNumber || 1}</span>
                                </span>
                            </div>
                        </div>

                        {/* BIG SCORE */}
                        <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Tổng điểm</p>
                                <p className={`text-3xl font-black ${getScoreColor(history.score)}`}>{history.score}/10</p>
                            </div>
                            <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
                            <div className="flex flex-col items-center">
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200" />
                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                                            className={getScoreColor(history.score)}
                                            strokeDasharray={175.9}
                                            strokeDashoffset={175.9 - (175.9 * (stats?.accuracy || 0)) / 100}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute text-xs font-bold text-gray-700">{stats?.accuracy}%</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Chính xác</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Đúng</p>
                            <p className="text-xl font-bold text-gray-900">{history.correctCount}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Sai</p>
                            <p className="text-xl font-bold text-gray-900">{history.wrongCount}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Tổng câu</p>
                            <p className="text-xl font-bold text-gray-900">{history.totalQuestions}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Xếp loại</p>
                            <p className="text-xl font-bold text-gray-900">
                                {history.score >= 8 ? "Giỏi" : history.score >= 5 ? "Khá" : "Chưa đạt"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Question List */}
                <div className="space-y-6">
                    {exam.examQuestions?.map(({ question: q }, index) => {
                        const studentSelectedIds = selectedAnswersMap[q.id] || {};
                        const userHasCorrect = Object.values(studentSelectedIds).some(isCorrect => isCorrect);
                        const userHasAnswered = Object.keys(studentSelectedIds).length > 0;

                        return (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`bg-white rounded-2xl p-6 md:p-8 shadow-sm border ${userHasCorrect ? 'border-emerald-200 ring-1 ring-emerald-50' :
                                    userHasAnswered ? 'border-rose-200 ring-1 ring-rose-50' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${userHasCorrect ? 'bg-emerald-100 text-emerald-700' :
                                            userHasAnswered ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-6 leading-relaxed">
                                            {q.title}
                                        </h3>

                                        <div className="flex flex-col gap-3">
                                            {q.answers.map((ans) => {
                                                const isSelected = studentSelectedIds[ans.id] !== undefined;
                                                const isSnapshotCorrect = isSelected ? studentSelectedIds[ans.id] : false;

                                                // Determine styles
                                                let containerClass = "relative flex items-center p-4 rounded-xl border-2 transition-all duration-200 ";
                                                let icon = <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 shrink-0" />;

                                                if (isSelected) {
                                                    if (isSnapshotCorrect) {
                                                        // Selected Correctly
                                                        containerClass += "bg-emerald-50 border-emerald-500 text-emerald-800";
                                                        icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-3 shrink-0" />;
                                                    } else {
                                                        // Selected Wrongly
                                                        containerClass += "bg-rose-50 border-rose-500 text-rose-800";
                                                        icon = <XCircle className="w-5 h-5 text-rose-600 mr-3 shrink-0" />;
                                                    }
                                                } else {
                                                    // Not selected
                                                    containerClass += "bg-white border-gray-100 text-gray-600 hover:border-violet-200";
                                                }

                                                return (
                                                    <div key={ans.id} className={containerClass}>
                                                        {icon}
                                                        <span className="font-medium text-sm md:text-base">{ans.text}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Show Correct Answer Logic */}
                                        <div className="mt-6 pt-5 border-t border-gray-100">
                                            <div className="flex items-start gap-3 bg-violet-50/50 p-4 rounded-xl border border-violet-100">
                                                <div className="bg-violet-100 text-violet-600 p-1.5 rounded-md mt-0.5">
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">Đáp án đúng</p>
                                                    <div className="text-gray-800 font-medium">
                                                        {(() => {
                                                            let correctList = q.answers.filter(a => a.correct);
                                                            if (correctList.length === 0 && q.correctAnswer) {
                                                                // Try to find by text matching
                                                                const match = q.answers.find(a =>
                                                                    a.text === q.correctAnswer ||
                                                                    String(a.text).toLowerCase() === String(q.correctAnswer).toLowerCase()
                                                                );
                                                                if (match) correctList = [match];
                                                                else correctList = [{ id: -1, text: q.correctAnswer, correct: true }];
                                                            }

                                                            return correctList.map((a, i) => (
                                                                <div key={i} className="mb-1 last:mb-0">{a.text}</div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
