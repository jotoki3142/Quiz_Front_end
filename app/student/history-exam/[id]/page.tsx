"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";

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

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );

    if (!history || !exam) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <p className="text-red-500 font-semibold">Không tìm thấy dữ liệu bài thi.</p>
        </div>
    );

    // Helper to format date
    const formatDate = (isoString: string) => {
        if (!isoString) return "---";
        // Convert to MM-DD-YYYY or matching mockup 12-19-2025
        const d = new Date(isoString);
        return d.toLocaleDateString('en-US').replace(/\//g, '-');
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return "---";
        return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds && seconds !== 0) return "---";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m} phút ${s} giây`;
    };

    const getDifficultyLabel = (level: string) => {
        const map: Record<string, string> = {
            'EASY': 'Dễ',
            'MEDIUM': 'Trung bình',
            'HARD': 'Khó',
        };
        return map[level] || level || "---";
    };

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans p-8">
            <div className="max-w-5xl mx-auto">
                <p className="text-gray-500 text-sm mb-4 uppercase tracking-wide">Xem chi tiết lịch sử thi</p>

                {/* --- GRAY RESULTS BOX --- */}
                <div className="bg-[#E5E7EB] border border-blue-400 rounded p-0 mb-8 overflow-hidden">
                    {/* Title */}
                    <div className="border-b border-gray-300 p-6">
                        <h1 className="text-2xl font-bold text-black">{history.examTitle}</h1>
                    </div>

                    {/* Info Row 1 */}
                    <div className="border-b border-gray-300 grid grid-cols-4 divide-x divide-gray-300 bg-[#E5E7EB]">
                        <div className="p-4 text-center">
                            <span className="block text-sm font-medium mb-1">Ngày thi:</span>
                            <span className="font-bold">{formatDate(history.submittedAt)}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-sm font-medium mb-1">Bắt đầu lúc:</span>
                            <span className="font-bold">{formatTime(history.startedAt || "")}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-sm font-medium mb-1">Loại đề thi:</span>
                            <span className="font-bold">{getDifficultyLabel(exam.examLevel)}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-sm font-medium mb-1">Thời gian làm bài:</span>
                            <span className="font-bold">{formatDuration(history.timeSpent)}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-sm font-medium mb-1">Thời gian nộp bài:</span>
                            <span className="font-bold">{formatTime(history.submittedAt)}</span>
                        </div>
                    </div>

                    {/* Info Row 2 (Stats) */}
                    <div className="grid grid-cols-3 divide-x divide-gray-300 bg-[#E5E7EB]">
                        <div className="p-4 text-center">
                            <span className="block text-sm font-medium mb-1">Số câu đúng:</span>
                            <span className="font-bold text-lg">{history.correctCount}/{history.totalQuestions}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-sm font-medium mb-1">Số điểm:</span>
                            <span className="font-bold text-lg">{history.score}</span>
                        </div>
                        <div className="p-4 text-center">
                            <span className="block text-sm font-medium mb-1">Lượt thi:</span>
                            <span className="font-bold text-lg">{history.attemptNumber || 1}</span>
                        </div>
                    </div>
                </div>


                {/* --- QUESTIONS LIST --- */}
                <div className="bg-white">
                    {exam.examQuestions?.map(({ question: q }, index) => {
                        const studentSelectedIds = selectedAnswersMap[q.id];

                        return (
                            <div key={q.id} className="mb-8 p-4">
                                {/* Question Title */}
                                <div className="flex gap-2 mb-4">
                                    <span className="font-bold text-[#4D1597]">{index + 1}.</span>
                                    <h3 className="font-bold text-[#4D1597]">{q.title}</h3>
                                </div>

                                {/* Answers */}
                                <div className="space-y-3 ml-6 mb-6">
                                    {q.answers.map((ans) => {
                                        const selectedRecord = studentSelectedIds || {};
                                        const isSelected = selectedRecord[ans.id] !== undefined;
                                        const isSnapshotCorrect = isSelected ? selectedRecord[ans.id] : false;

                                        // Based on Teacher logic but styled cleaner
                                        // Default
                                        let textStyle = "text-gray-700";
                                        let icon = (
                                            <div className={`w-4 h-4 rounded-full border border-gray-400 mr-3 flex items-center justify-center`}></div>
                                        );

                                        if (isSelected) {
                                            if (isSnapshotCorrect) { // User picked THIS ONE and it is CORRECT
                                                textStyle = "text-[#059669] font-bold"; // Green
                                                icon = (
                                                    <div className="w-4 h-4 rounded-full border border-[#059669] bg-[#059669] mr-3 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>
                                                );
                                            } else { // User picked THIS ONE and it is WRONG
                                                textStyle = "text-red-600 font-medium";
                                                icon = (
                                                    <div className="w-4 h-4 rounded-full border border-red-500 bg-red-500 mr-3 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>
                                                );
                                            }
                                        }

                                        // Special case: Highlight actual correct answer in green IF user missed it?
                                        // The mockup only shows user selection + "Đáp án" box below. 
                                        // Let's stick to the mockup: Only highlight user selection here.

                                        let containerStyle = "flex items-center p-2 rounded-lg";
                                        if (isSelected) {
                                            if (isSnapshotCorrect) {
                                                containerStyle += " bg-green-50 border border-green-200";
                                            } else {
                                                containerStyle += " bg-red-50 border border-red-200";
                                            }
                                        }

                                        return (
                                            <div key={ans.id} className={containerStyle}>
                                                {icon}
                                                <span className={textStyle}>{ans.text}</span>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Correct Answer Box */}
                                <div className="mt-4 ml-6 p-4 bg-[#F3EBFD] rounded-lg">
                                    <div className="flex flex-col items-start gap-3">
                                        <span className="bg-[#4D1597] text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wider shrink-0">
                                            Đáp án
                                        </span>
                                        <div className="text-[#4D1597] font-medium flex flex-col gap-1">
                                            {(() => {
                                                console.log(`[DEBUG] Question ID: ${q.id}, Type: ${q.type}, CorrectAnswer: ${q.correctAnswer}`);
                                                console.log(`[DEBUG] Answers:`, q.answers);

                                                let correctList = q.answers.filter(a => a.correct);
                                                // Fallback: If no answer is marked correct but we have a correctAnswer string
                                                if (correctList.length === 0 && q.correctAnswer) {
                                                    const match = q.answers.find(a =>
                                                        a.text === q.correctAnswer ||
                                                        String(a.text).toLowerCase() === String(q.correctAnswer).toLowerCase()
                                                    );
                                                    if (match) {
                                                        correctList = [match];
                                                    } else {
                                                        // If not found in options (e.g. data mismatch), show the raw string
                                                        correctList = [{ id: -1, text: q.correctAnswer, correct: true }];
                                                    }
                                                }

                                                return correctList.map(a => (
                                                    <div key={a.id} className="flex items-center gap-2">
                                                        <span className="text-lg">✓</span>
                                                        <span>{a.text}</span>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <hr className="mt-8 border-gray-300" />
                            </div>
                        )
                    })}
                </div>

            </div>
        </div>
    );
}
