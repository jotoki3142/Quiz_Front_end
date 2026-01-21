// app/student/do-exam/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import Swal from 'sweetalert2';
import { fetchApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';

// --- INTERFACES ---
interface AnswerOption {
    id: number;
    text: string;
}

interface Question {
    id: number;
    text: string;
    type: string; // RENAMED from questionType to match API
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

    // Store answers as Array regardless of type for consistency with backend DTO
    const [studentAnswers, setStudentAnswers] = useState<Record<number, number[]>>({});
    const [isLoading, setIsLoading] = useState(true);

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

                // Map Data
                console.log("Exam Data:", data);
                const mappedExam: ExamData = {
                    examId: data.examId,
                    title: data.title,
                    durationMinutes: data.durationMinutes,
                    questions: data.questions || [],
                    startTime: data.startTime,
                    endTime: data.endTime
                };

                setExam(mappedExam);
                setSecondsLeft(data.durationMinutes * 60);
                setIsLoading(false);
            } catch (error: any) {
                console.error("Error starting exam:", error);

                // Hiển thị lỗi cụ thể nếu có (VD: Bài thi chưa bắt đầu)
                const msg = error.message || "Không thể bắt đầu bài thi.";
                toast.error(msg);

                // Nếu lỗi 400 (Bad Request) thường là chưa đến giờ, quay lại list
                setTimeout(() => router.push('/student/list-exams'), 2000);
            }
        };

        startExam();
    }, [examIdParam, router]);

    // Nộp bài
    const handleSubmit = useCallback(async (autoSubmit = false) => {
        if (!exam || isSubmitted) return;

        if (!autoSubmit) {
            const confirm = await Swal.fire({
                title: "Xác nhận nộp bài",
                text: "Bạn chắc chắn muốn nộp bài?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Nộp bài",
                cancelButtonText: "Hủy",
                confirmButtonColor: "#E33AEC",
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
            const timeText = `${minutes} phút ${seconds} giây`;

            await Swal.fire({
                title: autoSubmit ? "Hết thời gian làm bài" : "Đã nộp bài!",
                html: `
                    <div class="space-y-2">
                        <p>Điểm số: <b>${result.score}</b></p>
                        <p>Số câu đúng: <b>${result.correctCount}/${result.totalQuestions}</b></p>
                        <p>Thời gian làm bài: <b>${timeText}</b></p>
                    </div>
                `,
                icon: "success",
                confirmButtonColor: "#E33AEC",
            });

            router.push('/student/list-exams');

        } catch (error: any) {
            console.error("Submit error:", error);
            toast.error("Có lỗi khi nộp bài: " + error.message);
        }

    }, [exam, isSubmitted, studentAnswers, router]);


    // Timer
    const hasWarnedLowTime = React.useRef(false);

    useEffect(() => {
        if (isSubmitted || isLoading || !exam) return;

        if (secondsLeft <= 0) {
            // Hết giờ -> Tự động nộp bài luôn, không hiện thông báo cũ đè lên
            handleSubmit(true);
            return;
        }

        // Warning when <= 5 minutes (300 seconds)
        if (secondsLeft <= 300 && !hasWarnedLowTime.current) {
            toast("⚠️ Chú ý: Thời gian làm bài còn dưới 5 phút!", {
                duration: 5000,
                style: {
                    border: '1px solid #F59E0B',
                    padding: '16px',
                    color: '#B45309',
                    backgroundColor: '#FFFBEB'
                },
            });
            hasWarnedLowTime.current = true;
        }

        const timer = setInterval(() => setSecondsLeft(s => s - 1), 1000);
        return () => clearInterval(timer);

    }, [secondsLeft, isSubmitted, handleSubmit, isLoading, exam]);


    // Handle Selection
    const handleAnswerChange = (questionId: number, answerId: number, type: string) => {
        if (isSubmitted) return;

        setStudentAnswers(prev => {
            const currentAnswers = prev[questionId] || [];

            // Check Question Type
            if (type === 'MULTIPLE') {
                // Checkbox logic (Toggle)
                if (currentAnswers.includes(answerId)) {
                    return { ...prev, [questionId]: currentAnswers.filter(id => id !== answerId) };
                } else {
                    return { ...prev, [questionId]: [...currentAnswers, answerId] };
                }
            } else {
                // Radio logic (Replace) -> SINGLE or TRUE_FALSE
                return { ...prev, [questionId]: [answerId] };
            }
        });
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-green-600 border-b-2" />
                <p className="mt-4 text-lg font-semibold text-gray-700">Đang tải đề thi...</p>
            </div>
        </div>
    );

    if (!exam) return <div className="p-8 text-center text-gray-500">Không có dữ liệu bài thi.</div>;

    return (
        <div className="bg-gray-50 min-h-[calc(100vh-65px)]">
            <div className="max-w-7xl mx-auto p-4 md:p-8">

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* LEFT COLUMN: Main Content */}
                    <div className="lg:col-span-3 order-2 lg:order-1">

                        {/* Header */}
                        <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-md sticky top-0 z-10 transition-all">
                            <h1 className="text-xl font-bold text-gray-800 line-clamp-1 flex-1 mr-4">{exam.title}</h1>

                            <div className="flex items-center">
                                <span className="mr-2 text-gray-700 font-semibold text-lg">Thời gian:</span>
                                <div className={`text-xl font-bold ${secondsLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                                    {Math.floor(secondsLeft / 60)}:
                                    {(secondsLeft % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                        </div>

                        {/* Question List */}
                        <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
                            {exam.questions.map((q, index) => {
                                const selectedForQ = studentAnswers[q.id] || [];
                                const isMultiple = q.type === 'MULTIPLE';

                                return (
                                    <div
                                        key={q.id}
                                        id={`question-${index}`} // Added ID for navigation
                                        className="border-b pb-6 last:border-0 hover:bg-gray-50 p-4 rounded-lg transition scroll-mt-24"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="font-semibold text-lg flex-1">Câu {index + 1}: {q.text}</p>
                                            <span className={`text-xs px-2 py-1 rounded ml-2 ${isMultiple ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {isMultiple ? 'Chọn nhiều' : 'Chọn 1'}
                                            </span>
                                        </div>

                                        {isMultiple && <p className="text-sm text-gray-400 italic mb-2">(Chọn tất cả đáp án đúng)</p>}

                                        <div className="mt-3 space-y-2">
                                            {q.answers.map(a => {
                                                const isSelected = selectedForQ.includes(a.id);
                                                return (
                                                    <label key={a.id} className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-100 transition select-none">
                                                        <input
                                                            type={isMultiple ? "checkbox" : "radio"}
                                                            name={`q-${q.id}`}
                                                            checked={isSelected}
                                                            onChange={() => handleAnswerChange(q.id, a.id, q.type)}
                                                            className={`w-5 h-5 text-pink-600 focus:ring-pink-500 border-gray-300 ${!isMultiple ? 'rounded-full' : 'rounded'}`}
                                                        />
                                                        <span className={`ml-3 ${isSelected ? 'text-[#E33AEC] font-medium' : 'text-gray-700'}`}>
                                                            {a.text}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer Buttons (Mobile & Desktop in Flow) */}
                        <div className="flex justify-center gap-6 mt-8 pb-10">
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={isSubmitted}
                                className="text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 block w-full md:w-auto"
                                style={{ backgroundColor: '#E33AEC' }}
                            >
                                {isSubmitted ? "Đã nộp bài" : "Nộp bài"}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Question Navigation & Submit */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="sticky top-24 bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Danh sách câu hỏi</h3>

                            <div className="grid grid-cols-5 gap-2 mb-6">
                                {exam.questions.map((q, index) => {
                                    const hasAnswer = studentAnswers[q.id] && studentAnswers[q.id].length > 0;
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
                                                w-8 h-8 rounded text-sm font-semibold flex items-center justify-center transition
                                                ${hasAnswer
                                                    ? 'bg-[#E33AEC] text-white hover:bg-[#d633dd]'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}
                                            `}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-2 text-xs text-gray-500">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded bg-[#E33AEC] mr-2"></div>
                                    <span>Đã làm</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200 mr-2"></div>
                                    <span>Chưa làm</span>
                                </div>
                            </div>

                            {/* Button Nộp bài - Desktop Sidebar specific */}
                            {/* Only show here if desired, otherwise rely on the main bottom button */}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DoExamContent;
