"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { fetchApi } from "@/lib/apiClient";
import {
    Search,
    Filter,
    Layers,
    Clock,
    Calendar,
    Play,
    BookOpen,
    AlertCircle,
    CheckCircle2,
    Clock3,
    Timer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Interfaces ---
interface Exam {
    id: number;
    title: string;
    category: string;
    duration: string;
    questionCount: number;
    level: string;
    startTime: string;
    endTime: string;
    status: 'BEFORE' | 'READY' | 'ENDED' | 'UNKNOWN';
}

interface Category {
    id: number;
    name: string;
}

export default function StudentListExamsPage() {
    const router = useRouter();
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [difficulty, setDifficulty] = useState("");

    const [categories, setCategories] = useState<Category[]>([]);

    // Fetch Categories
    useEffect(() => {
        fetchApi("/categories/all")
            .then((data: any) => {
                if (Array.isArray(data)) setCategories(data);
            })
            .catch(console.error);
    }, []);

    // Fetch Exams
    useEffect(() => {
        const fetchExams = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams();
                if (searchQuery) params.append('title', searchQuery);
                if (selectedCategory) params.append('categoryId', selectedCategory);
                if (difficulty) params.append('examLevel', difficulty);

                const response = await fetchApi(`/student/exams/search?${params.toString()}`);
                const data = response.content || response.data || [];

                const mapLevel = (level: string) => {
                    const map: Record<string, string> = {
                        'EASY': 'Dễ',
                        'MEDIUM': 'Trung bình',
                        'HARD': 'Khó'
                    };
                    return map[level] || level;
                };

                const mappedExams = Array.isArray(data)
                    ? data.map((exam: any) => {
                        let status: Exam['status'] = 'UNKNOWN';
                        if (exam.startTime && exam.endTime) {
                            const now = new Date();
                            const start = new Date(exam.startTime);
                            const end = new Date(exam.endTime);

                            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                if (now < start) status = 'BEFORE';
                                else if (now > end) status = 'ENDED';
                                else status = 'READY';
                            }
                        }

                        return {
                            id: exam.examId,
                            title: exam.title,
                            category: exam.category?.name || "Chưa phân loại",
                            duration: `${exam.durationMinutes} phút`,
                            questionCount: exam.questionCount || 0,
                            level: mapLevel(exam.examLevel),
                            startTime: exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN') : 'Tự do',
                            endTime: exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN') : 'Tự do',
                            status,
                        };
                    })
                    : [];

                // Sort: Ready first, then by StartTime
                const sorted = mappedExams.sort((a, b) => {
                    const statusOrder = { 'READY': 1, 'BEFORE': 2, 'ENDED': 3, 'UNKNOWN': 4 };
                    if (statusOrder[a.status] !== statusOrder[b.status]) {
                        return statusOrder[a.status] - statusOrder[b.status];
                    }
                    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
                });

                setExams(sorted);
            } catch (error) {
                console.error("Failed to fetch exams:", error);
                toast.error("Không thể tải danh sách bài thi.");
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchExams();
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory, difficulty]);

    const handleStartExam = (exam: Exam) => {
        if (exam.status === 'BEFORE') {
            toast.error("Bài thi chưa bắt đầu!");
            return;
        }
        if (exam.status === 'ENDED') {
            toast.error("Bài thi đã kết thúc!");
            return;
        }

        Swal.fire({
            title: `Bắt đầu bài thi?`,
            html: `<p class="text-gray-600 mb-2">Bạn đang chuẩn bị làm bài:</p>
                   <h3 class="text-xl font-bold text-violet-600 mb-4">${exam.title}</h3>
                   <ul class="text-left text-sm text-gray-500 space-y-1 mb-4 bg-gray-50 p-4 rounded-lg">
                        <li>⏱️ Thời gian: <b>${exam.duration}</b></li>
                        <li>❓ Số câu hỏi: <b>${exam.questionCount}</b></li>
                   </ul>
                   <p class="text-red-500 font-medium text-sm">⚠️ Lưu ý: Thời gian sẽ bắt đầu tính ngay khi bạn nhấn Bắt đầu.</p>`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#7C3AED',
            cancelButtonColor: '#9CA3AF',
            confirmButtonText: '🚀 Bắt đầu ngay',
            cancelButtonText: 'Quay lại',
            customClass: {
                popup: 'rounded-2xl',
                confirmButton: 'rounded-xl px-6 py-3 font-bold',
                cancelButton: 'rounded-xl px-6 py-3 font-medium'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.push(`/student/do-exam?examId=${exam.id}`);
            }
        });
    };

    // Group by Category for display
    const groupedExams = useMemo(() => {
        return exams.reduce((acc, exam) => {
            if (!acc[exam.category]) acc[exam.category] = [];
            acc[exam.category].push(exam);
            return acc;
        }, {} as Record<string, Exam[]>);
    }, [exams]);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* HERO HEADER */}
            <div className="bg-white border-b border-gray-200 relative overflow-hidden mb-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Danh sách bài thi
                    </h1>
                    <p className="text-gray-500 max-w-2xl text-lg">
                        Khám phá và thử thách bản thân với hàng trăm bài thi đa dạng từ nhiều lĩnh vực khác nhau.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">

                {/* FILTERS BAR */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 mb-10 sticky top-4 z-10 backdrop-blur-xl bg-white/95 supports-[backdrop-filter]:bg-white/80">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm bài thi..."
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all placeholder:text-gray-400 text-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="relative w-full lg:w-64 group">
                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                            <select
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all text-sm font-medium text-gray-600 appearance-none cursor-pointer hover:bg-white"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Tất cả danh mục</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Difficulty Dropdown */}
                        <div className="relative w-full lg:w-48 group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                            <select
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all text-sm font-medium text-gray-600 appearance-none cursor-pointer hover:bg-white"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="">Độ khó</option>
                                <option value="EASY">Dễ</option>
                                <option value="MEDIUM">Trung bình</option>
                                <option value="HARD">Khó</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT AREA */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Đang tìm kiếm bài thi...</p>
                    </div>
                ) : exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                            <BookOpen size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy bài thi nào</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác xem sao.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(groupedExams).sort((a, b) => a[0].localeCompare(b[0])).map(([category, categoryExams]) => (
                            <section key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-8 w-1 bg-violet-600 rounded-full"></div>
                                    <h2 className="text-2xl font-bold text-gray-800">{category}</h2>
                                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                                        {categoryExams.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {categoryExams.map((exam) => (
                                        <div
                                            key={exam.id}
                                            className="group bg-white rounded-2xl border border-gray-200 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-200/20 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                                        >
                                            {/* Top Decoration */}
                                            <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                                            <div className="p-6 flex flex-col flex-1">
                                                {/* Labels */}
                                                <div className="flex items-start justify-between gap-2 mb-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${exam.level === 'Dễ' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            exam.level === 'Trung bình' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                'bg-rose-50 text-rose-600 border border-rose-100'
                                                        }`}>
                                                        {exam.level}
                                                    </span>

                                                    {/* Status Badge */}
                                                    {exam.status === 'READY' && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Sẵn sàng
                                                        </span>
                                                    )}
                                                    {exam.status === 'BEFORE' && (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                                            Sắp diễn ra
                                                        </span>
                                                    )}
                                                    {exam.status === 'ENDED' && (
                                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                                                            Đã kết thúc
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-violet-600 transition-colors">
                                                    {exam.title}
                                                </h3>

                                                {/* Meta Info */}
                                                <div className="space-y-2 mt-auto">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Clock3 size={16} className="text-gray-400" />
                                                        <span>Thời gian: <b className="text-gray-800">{exam.duration}</b></span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <BookOpen size={16} className="text-gray-400" />
                                                        <span>Số câu: <b className="text-gray-800">{exam.questionCount}</b></span>
                                                    </div>
                                                </div>

                                                {/* Divider */}
                                                <div className="my-5 border-t border-gray-100 border-dashed"></div>

                                                {/* Timing if scheduled */}
                                                {(exam.startTime !== 'Tự do' && exam.startTime) && (
                                                    <div className="bg-gray-50 rounded-xl p-3 mb-5 text-xs space-y-1.5">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Bắt đầu:</span>
                                                            <span className="font-semibold text-gray-900">{exam.startTime}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Kết thúc:</span>
                                                            <span className="font-semibold text-gray-900">{exam.endTime}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => handleStartExam(exam)}
                                                    disabled={exam.status === 'BEFORE' || exam.status === 'ENDED'}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${exam.status === 'READY' || exam.status === 'UNKNOWN'
                                                            ? 'bg-gray-900 text-white hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-200 active:scale-95'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {exam.status === 'BEFORE' ? (
                                                        <>Wait <Timer size={16} /></>
                                                    ) : exam.status === 'ENDED' ? (
                                                        <>Ended <AlertCircle size={16} /></>
                                                    ) : (
                                                        <>Làm bài ngay <Play size={16} fill="currentColor" /></>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}