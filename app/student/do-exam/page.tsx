"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { fetchApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import {
    Clock,
    AlertTriangle,
    CheckCircle2,
    Circle,
    Menu,
    ChevronRight,
    Send,
    HelpCircle
} from 'lucide-react';

// --- INTERFACES ---
interface AnswerOption {
    id: number;
    text: string;
}

interface Question {
    id: number;
    text: string;
    type: string;
    answers: AnswerOption[];
}

interface ExamData {
    examId: number;
    title: string;
    durationMinutes: number;
    questions: Question[];
    startTime?: string;
    endTime?: string;
}

/* ===========================================================
    MAIN CONTENT
=========================================================== */
const DoExamContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const examIdParam = searchParams.get('examId') || searchParams.get('subjectId');

    const [exam, setExam] = useState<ExamData | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Store answers as Array
    const [studentAnswers, setStudentAnswers] = useState<Record<number, number[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    const hasWarnedLowTime = useRef(false);

    // Call API Start Exam
    useEffect(() => {
        if (!examIdParam) {
            toast.error("Không tìm thấy ID bài thi");
            router.push('/student/list-exams');
            return;
        }

        const startExam = async () => {
            try {
                const data = await fetchApi(`/student/exams/${examIdParam}/start`, {
                    method: 'POST'
                });

                const mappedExam: ExamData = {
                    examId: data.examId,
                    title: data.title,
                    durationMinutes: data.durationMinutes,
                    questions: data.questions || [],
                    startTime: data.startTime,
                    endTime: data.endTime
                };

                setExam(mappedExam);
                // Ensure we handle seconds correctly if backend returns total seconds or just minutes
                // Assuming minutes based on interface
                setSecondsLeft(data.durationMinutes * 60);
                setIsLoading(false);
            } catch (error: any) {
                console.error("Error starting exam:", error);
                const msg = error.message || "Không thể bắt đầu bài thi.";
                toast.error(msg);
                setTimeout(() => router.push('/student/list-exams'), 2000);
            }
        };

        startExam();
    }, [examIdParam, router]);

    // Submit Logic
    const handleSubmit = useCallback(async (autoSubmit = false) => {
        if (!exam || isSubmitted) return;

        if (!autoSubmit) {
            const unansweredCount = exam.questions.length - Object.keys(studentAnswers).length;
            const confirm = await Swal.fire({
                title: "Nộp bài thi?",
                html: unansweredCount > 0
                    ? `<p class="text-gray-600">Bạn còn <b class="text-rose-600">${unansweredCount}</b> câu chưa trả lời.</p>`
                    : `<p class="text-gray-600">Bạn đã hoàn thành tất cả câu hỏi.</p>`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Nộp ngay",
                cancelButtonText: "Kiểm tra lại",
                confirmButtonColor: "#7C3AED",
                cancelButtonColor: "#9CA3AF",
                customClass: {
                    popup: 'rounded-2xl',
                    confirmButton: 'rounded-xl px-6 py-2',
                    cancelButton: 'rounded-xl px-6 py-2'
                }
            });
            if (!confirm.isConfirmed) return;
        }

        try {
            const timeSpent = Math.floor((exam.durationMinutes * 60 - secondsLeft));
            const payload = {
                examId: exam.examId,
                answers: studentAnswers,
                timeSpent: timeSpent > 0 ? timeSpent : 0
            };

            const result = await fetchApi('/student/exams/submit', {
                method: 'POST',
                body: payload
            });

            setIsSubmitted(true);
            setSecondsLeft(0);

            const minutes = Math.floor(timeSpent / 60);
            const seconds = timeSpent % 60;
            const timeText = `${minutes}p ${seconds}s`;

            await Swal.fire({
                title: autoSubmit ? "Hết thời gian!" : "Nộp bài thành công!",
                html: `
                    <div class="space-y-3 mt-4">
                        <div class="inline-flex justify-center items-center w-20 h-20 rounded-full bg-violet-50 text-violet-600 mb-2">
                            <span class="text-3xl font-bold">${result.score}</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800">Điểm số của bạn</h3>
                        <div class="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-500">Đúng:</span>
                                <span class="font-bold text-emerald-600">${result.correctCount}/${result.totalQuestions}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Thời gian:</span>
                                <span class="font-bold text-gray-800">${timeText}</span>
                            </div>
                        </div>
                    </div>
                `,
                icon: autoSubmit ? "warning" : "success",
                confirmButtonColor: "#7C3AED",
                confirmButtonText: "Xem chi tiết",
                allowOutsideClick: false,
                customClass: {
                    popup: 'rounded-2xl',
                    confirmButton: 'rounded-xl w-full py-3 font-bold'
                }
            });

            // Redirect based on exam type (if online -> result, if offline -> detail)
            // Backend result might contain examOnlineId logic, but usually we go to list or detail
            router.push(`/student/exam-result/${result.id || result.examHistoryId}`);

        } catch (error: any) {
            console.error("Submit error:", error);
            toast.error("Có lỗi khi nộp bài: " + error.message);
        }

    }, [exam, isSubmitted, studentAnswers, router, secondsLeft]);


    // Timer Effect
    useEffect(() => {
        if (isSubmitted || isLoading || !exam) return;

        if (secondsLeft <= 0) {
            handleSubmit(true);
            return;
        }

        // Warning when <= 5 minutes (300 seconds)
        if (secondsLeft <= 300 && !hasWarnedLowTime.current) {
            toast("⚠️ Thời gian còn lại dưới 5 phút!", {
                icon: '⏳',
                style: {
                    border: '1px solid #F59E0B',
                    color: '#B45309',
                    background: '#FFFBEB'
                },
            });
            hasWarnedLowTime.current = true;
        }

        const timer = setInterval(() => setSecondsLeft(s => s > 0 ? s - 1 : 0), 1000);
        return () => clearInterval(timer);

    }, [secondsLeft, isSubmitted, handleSubmit, isLoading, exam]);


    // Handle Selection
    const handleAnswerChange = (questionId: number, answerId: number, type: string) => {
        if (isSubmitted) return;

        setStudentAnswers(prev => {
            const currentAnswers = prev[questionId] || [];

            if (type === 'MULTIPLE') {
                if (currentAnswers.includes(answerId)) {
                    return { ...prev, [questionId]: currentAnswers.filter(id => id !== answerId) };
                } else {
                    return { ...prev, [questionId]: [...currentAnswers, answerId] };
                }
            } else {
                return { ...prev, [questionId]: [answerId] };
            }
        });
    };

    if (isLoading) return (
        <div className="flex bg-gray-50 h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                <p className="font-medium text-gray-500 animate-pulse">Đang tải đề thi...</p>
            </div>
        </div>
    );

    if (!exam) return null;

    const formattedTime = `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`;
    const progressPercent = ((exam.questions.length - (exam.questions.length - Object.keys(studentAnswers).length)) / exam.questions.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-slate-800">

            {/* STICKY HEADER */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm supports-[backdrop-filter]:bg-white/80">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900 truncate max-w-md hidden md:block" title={exam.title}>
                        {exam.title}
                    </h1>
                    <div className="md:hidden text-sm font-bold text-gray-900 truncate max-w-[150px]">
                        {exam.title}
                    </div>

                    <div className="flex items-center gap-4 md:gap-8">
                        {/* Progress Bar (Mini) */}
                        <div className="hidden md:flex flex-col w-32 gap-1">
                            <div className="flex justify-between text-[10px] text-gray-500 font-semibold uppercase">
                                <span>Tiến độ</span>
                                <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-violet-600 transition-all duration-500 ease-out rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Timer */}
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-xl font-bold border transition-colors ${secondsLeft < 300
                            ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                            : 'bg-gray-50 text-gray-800 border-gray-200'
                            }`}>
                            <Clock size={20} className={secondsLeft < 300 ? 'text-rose-600' : 'text-gray-400'} />
                            {formattedTime}
                        </div>

                        {/* Submit Btn (Desktop) */}
                        <button
                            onClick={() => handleSubmit(false)}
                            className="hidden md:flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-violet-200 active:scale-95"
                        >
                            <Send size={16} /> Nộp bài
                        </button>
                    </div>
                </div>

                {/* Mobile Progress Bar */}
                <div className="md:hidden w-full h-1 bg-gray-200">
                    <div
                        className="h-full bg-violet-600 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* LEFT COLUMN: QUESTIONS */}
                    <main className="lg:col-span-3 space-y-6">
                        {exam.questions.map((q, index) => {
                            const selectedForQ = studentAnswers[q.id] || [];
                            const isMultiple = q.type === 'MULTIPLE';
                            const isAnswered = selectedForQ.length > 0;

                            return (
                                <div
                                    key={q.id}
                                    id={`question-${index}`}
                                    className={`bg-white rounded-2xl p-6 md:p-8 shadow-sm border transition-all duration-200 scroll-mt-24 group ${isAnswered ? 'border-violet-200 ring-1 ring-violet-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <div className="shrink-0">
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-colors ${isAnswered ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
                                                    {q.text}
                                                </h3>
                                                {isMultiple && (
                                                    <span className="shrink-0 ml-4 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                        Chọn nhiều
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                {q.answers.map(a => {
                                                    const isSelected = selectedForQ.includes(a.id);
                                                    return (
                                                        <label
                                                            key={a.id}
                                                            className={`relative flex items-center p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 group/label ${isSelected
                                                                ? 'bg-violet-50 border-violet-500 z-10'
                                                                : 'bg-white border-transparent hover:bg-gray-50 border-gray-100'
                                                                }`}
                                                        >
                                                            <div className="flex items-center h-5">
                                                                <input
                                                                    type={isMultiple ? "checkbox" : "radio"}
                                                                    name={`q-${q.id}`}
                                                                    checked={isSelected}
                                                                    onChange={() => handleAnswerChange(q.id, a.id, q.type)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-violet-600 bg-violet-600' : 'border-gray-300 group-hover/label:border-violet-400'
                                                                    }`}>
                                                                    {isSelected && (
                                                                        <div className="w-2 h-2 bg-white rounded-full" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={`ml-3 text-sm md:text-base font-medium transition-colors ${isSelected ? 'text-violet-900' : 'text-gray-700'
                                                                }`}>
                                                                {a.text}
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </main>

                    {/* RIGHT COLUMN: NAVIGATION */}
                    <aside className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-20 bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900">Mục lục câu hỏi</h3>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                    {Object.keys(studentAnswers).length}/{exam.questions.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                {exam.questions.map((q, index) => {
                                    const isAnswered = studentAnswers[q.id] && studentAnswers[q.id].length > 0;
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => {
                                                document.getElementById(`question-${index}`)?.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'center'
                                                });
                                            }}
                                            className={`
                                                aspect-square rounded-lg text-sm font-bold transition-all duration-200
                                                flex items-center justify-center
                                                ${isAnswered
                                                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
                                                }
                                            `}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-6 space-y-3 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                    <div className="w-3 h-3 rounded bg-violet-600" /> Đã trả lời
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                    <div className="w-3 h-3 rounded bg-white border border-gray-300" /> Chưa trả lời
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* MOBILE FLOATING ACTION BUTTON */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => handleSubmit(false)}
                    className="flex items-center justify-center w-14 h-14 bg-violet-600 text-white rounded-full shadow-lg shadow-violet-300 active:scale-95 transition-transform"
                >
                    <Send size={24} />
                </button>
            </div>
        </div>
    );
};

export default DoExamContent;
