"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError } from "@/lib/toast";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Trophy,
    Home,
    Loader2,
    Check,
    BarChart3,
    ListChecks,
    ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";

// --- Interfaces ---
interface StudentAnswerDto {
    questionId: number;
    answerId: number;
    isCorrect: boolean;
}

interface ExamResult {
    examHistoryId: number;
    examId: number;
    examOnlineId?: number;
    examTitle: string;
    score: number;
    correctCount: number;
    wrongCount: number;
    totalQuestions: number;
    passed: boolean;
    submittedAt: string;
    studentAnswers: StudentAnswerDto[]; // Added for detail view
    timeSpent?: number;
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

export default function StudentExamResultPage() {
    const params = useParams();
    const router = useRouter();
    const historyId = params.historyId as string;

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<ExamResult | null>(null);
    const [exam, setExam] = useState<ExamDetail | null>(null); // Added for detail view
    const [rank, setRank] = useState<number | null>(null);
    const [totalParticipants, setTotalParticipants] = useState<number>(0);
    const [selectedAnswersMap, setSelectedAnswersMap] = useState<Record<number, Record<number, boolean>>>({});

    useEffect(() => {
        if (!historyId) return;

        const fetchResult = async () => {
            try {
                setLoading(true);
                // 1. Get History Detail
                const data = await fetchApi(`/examHistory/detail/${historyId}`);
                console.log("[DEBUG] Exam result data:", data);
                setResult(data);

                // Map student answers for easy lookup
                const answersMap: Record<number, Record<number, boolean>> = {};
                if (data.studentAnswers) {
                    data.studentAnswers.forEach((sa: StudentAnswerDto) => {
                        if (!answersMap[sa.questionId]) {
                            answersMap[sa.questionId] = {};
                        }
                        answersMap[sa.questionId][sa.answerId] = sa.isCorrect;
                    });
                }
                setSelectedAnswersMap(answersMap);

                // 2. Fetch Exam Definition (Questions)
                if (data.examId) {
                    try {
                        const examData = await fetchApi(`/exams/get/${data.examId}`);
                        setExam(examData);
                    } catch (examErr) {
                        console.error("Failed to load exam definitions", examErr);
                        // Don't block whole page if questions fail to load, just detail sec will be empty
                    }
                }

                // 3. Fetch ranking if this is an online exam
                if (data.examOnlineId) {
                    try {
                        const allResults = await fetchApi(`/examHistory/online-exam/${data.examOnlineId}`);
                        // Sort by score descending
                        const sorted = allResults.sort((a: any, b: any) => b.score - a.score);
                        const studentRank = sorted.findIndex((r: any) => r.id === data.examHistoryId) + 1;
                        setRank(studentRank);
                        setTotalParticipants(sorted.length);
                    } catch (rankError) {
                        console.error("Failed to load ranking:", rankError);
                    }
                }
            } catch (error: any) {
                console.error("Failed to load result:", error);
                toastError(error.message || "Không thể tải kết quả");
                router.push("/student/studenthome");
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [historyId, router]);

    const getScoreColor = (score: number) => {
        if (score >= 8) return "text-emerald-600";
        if (score >= 5) return "text-amber-600";
        return "text-rose-600";
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds && seconds !== 0) return "---";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}p ${s}s`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="animate-spin" />
                    <span>Đang tải kết quả...</span>
                </div>
            </div>
        );
    }

    if (!result) return null;

    const percentage = (result.score / 10) * 100;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* HERO HEADER - Use consistent gradient */}
            <div className="bg-white border-b border-gray-200 relative overflow-hidden mb-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

                <div className="max-w-4xl mx-auto px-6 py-10 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-violet-50 text-violet-600 ring-8 ring-violet-50/50">
                        <Trophy size={40} />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Kết quả bài thi
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                        {result.examTitle}
                    </p>

                    {/* Quick Stats Row in Header */}
                    <div className="flex justify-center gap-4 mt-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 bg-gray-100/80 px-3 py-1.5 rounded-full">
                            <Clock size={16} /> Thời gian: <span className="font-bold text-gray-900">{formatDuration(result.timeSpent)}</span>
                        </span>
                        <span className="flex items-center gap-1.5 bg-gray-100/80 px-3 py-1.5 rounded-full">
                            <ListChecks size={16} /> Tổng câu: <span className="font-bold text-gray-900">{result.totalQuestions}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6">

                {/* 1. SCORE CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>

                    <div className="flex flex-col items-center mb-10">
                        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-fuchsia-600 mb-2 tracking-tighter">
                            {result.score.toFixed(1)}
                            <span className="text-4xl text-gray-300 font-bold ml-1">/10</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-200"
                            />
                        </div>
                    </div>

                    {/* Detailed Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-center text-center">
                            <CheckCircle2 className="text-emerald-600 mb-2" size={28} />
                            <div className="text-2xl font-bold text-emerald-700">{result.correctCount}</div>
                            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Câu đúng</div>
                        </div>

                        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 flex flex-col items-center text-center">
                            <XCircle className="text-rose-600 mb-2" size={28} />
                            <div className="text-2xl font-bold text-rose-700">{result.wrongCount}</div>
                            <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Câu sai</div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center text-center">
                            <BarChart3 className="text-blue-600 mb-2" size={28} />
                            <div className="text-2xl font-bold text-blue-700">{percentage.toFixed(0)}%</div>
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Chính xác</div>
                        </div>

                        {rank ? (
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex flex-col items-center text-center relative overflow-hidden">
                                <Trophy className="text-amber-600 mb-2 relative z-10" size={28} />
                                <div className="text-2xl font-bold text-amber-700 relative z-10">#{rank}</div>
                                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider relative z-10">Xếp hạng</div>
                                <div className="absolute -bottom-4 -right-4 text-amber-100 transform rotate-12">
                                    <Trophy size={80} />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col items-center text-center">
                                <Trophy className="text-gray-400 mb-2" size={28} />
                                <div className="text-2xl font-bold text-gray-500">-</div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Xếp hạng</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. QUESTION DETAILS SECTION */}
                {exam && exam.examQuestions && exam.examQuestions.length > 0 && (
                    <div className="mt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-1 bg-violet-600 rounded-full"></div>
                            <h2 className="text-xl font-bold text-gray-900">Chi tiết bài làm</h2>
                        </div>

                        <div className="space-y-6">
                            {exam.examQuestions.map(({ question: q }, index) => {
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
                )}

                {/* 3. FOOTER ACTIONS */}
                <div className="flex justify-center gap-4 mt-12">
                    <button
                        onClick={() => router.push("/student/studenthome")}
                        className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:translate-y-[-2px] hover:shadow-xl"
                    >
                        <Home size={20} />
                        Về trang chủ
                    </button>
                    <button
                        onClick={() => router.push("/student/history-exam")}
                        className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 hover:border-violet-200 hover:text-violet-700 hover:bg-violet-50 rounded-xl font-bold flex items-center gap-2 transition-all"
                    >
                        <ListChecks size={20} />
                        Xem lịch sử thi
                    </button>
                </div>
            </div>
        </div>
    );
}
