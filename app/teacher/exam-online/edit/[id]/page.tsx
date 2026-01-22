"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { fetchApi } from "@/lib/apiClient";
import { toastSuccess, toastError } from "@/lib/toast";
import { createPortal } from "react-dom";
import {
    PencilSquareIcon,
    PlusCircleIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    TagIcon,
    SwatchIcon,
    ClockIcon,
    ArrowLeftIcon,
    BookOpenIcon,
    CheckCircleIcon,
    FunnelIcon,
    XMarkIcon,
    ListBulletIcon,
    Squares2X2Icon,
    FolderIcon,
    ChevronDownIcon,
    EyeIcon,
    ChartBarIcon,
    AcademicCapIcon
} from "@heroicons/react/24/outline";
import { CheckIcon, UsersIcon } from "@heroicons/react/20/solid";

// ===== TYPES =====
interface Answer {
    id?: number;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id?: number;
    title: string;
    type: string;
    difficulty: string;
    categoryId: string | number;
    categoryName?: string;
    answers: Answer[];
    createdBy?: string;
    createdByName?: string;
    visibility?: string;
    isReadOnly?: boolean; // True for Library Questions
}

interface ExamFormValues {
    name: string;
    level: string;
    durationMinutes: number;
    passingScore: number;
    maxParticipants: number;
    categoryId: string | number;
    questions: Question[];
}

interface Category {
    id: number;
    name: string;
}

// ===== VALIDATION SCHEMA =====
const validationSchema = Yup.object().shape({
    name: Yup.string().required("Tên bài thi là bắt buộc"),
    level: Yup.string().required("Độ khó là bắt buộc"),
    durationMinutes: Yup.number()
        .required("Thời gian làm bài là bắt buộc")
        .min(1, "Thời gian phải lớn hơn 0"),
    passingScore: Yup.number()
        .required("Điểm đạt là bắt buộc")
        .min(0, "Điểm phải từ 0")
        .max(10, "Điểm tối đa là 10"),
    maxParticipants: Yup.number()
        .required("Số người tham gia là bắt buộc")
        .min(1, "Phải có ít nhất 1 người"),
    categoryId: Yup.string().required("Danh mục là bắt buộc"),
    questions: Yup.array().of(
        Yup.object().shape({
            title: Yup.string().required("Tiêu đề câu hỏi là bắt buộc"),
            type: Yup.string().required("Loại câu hỏi là bắt buộc"),
            difficulty: Yup.string().required("Độ khó là bắt buộc"),
            answers: Yup.array()
                .of(
                    Yup.object().shape({
                        text: Yup.string().required("Nội dung đáp án là bắt buộc"),
                    })
                )
                .min(2, "Phải có ít nhất 2 đáp án")
                .test(
                    "one-correct",
                    "Phải có ít nhất 1 đáp án đúng",
                    (answers) => answers?.some((a: any) => a.isCorrect) || false
                ),
        })
    ).min(1, "Bài thi phải có ít nhất 1 câu hỏi"),
});

// --- Badge Components ---
const TypeBadge = ({ type }: { type: string }) => {
    switch (type) {
        case 'SINGLE':
            return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-100 text-violet-700">Một đáp án</div>;
        case 'MULTIPLE':
            return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-fuchsia-100 text-fuchsia-700">Nhiều đáp án</div>;
        case 'TRUE_FALSE':
            return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-100 text-cyan-700">Đúng/Sai</div>;
        default:
            return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-500">{type}</div>;
    }
};

const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
    const d = difficulty?.toUpperCase();
    switch (d) {
        case 'EASY':
            return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Dễ</div>;
        case 'MEDIUM':
            return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Trung bình</div>;
        case 'HARD':
            return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">Khó</div>;
        default:
            return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">{difficulty}</div>;
    }
};

const VisibilityBadge = ({ visibility }: { visibility?: string }) => {
    if (visibility === 'PUBLIC') {
        return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">Công khai</div>;
    }
    return <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center gap-1">Riêng tư</div>;
};

// --- Modals ---
const QuestionDetailModal = ({ question, onClose }: { question: Question | null, onClose: () => void }) => {
    if (!question) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[99999] backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-zinc-100 bg-zinc-50/50 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-xl text-violet-600">
                            <EyeIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Chi tiết câu hỏi</h2>
                            <p className="text-sm text-zinc-500 font-medium">ID: #{question.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1 group hover:border-violet-200 transition-colors">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loại câu hỏi</span>
                            <TypeBadge type={question.type} />
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1 group hover:border-violet-200 transition-colors">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Độ khó</span>
                            <DifficultyBadge difficulty={question.difficulty} />
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1 group hover:border-violet-200 transition-colors">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
                            <VisibilityBadge visibility={question.visibility} />
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1 group hover:border-violet-200 transition-colors">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục</span>
                            <span className="px-2 py-0.5 rounded text-sm font-bold text-zinc-700 truncate max-w-full" title={question.categoryName}>
                                {question.categoryName || "Chưa phân loại"}
                            </span>
                        </div>
                    </div>

                    {/* Question Content */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            Mô tả câu hỏi
                        </h3>
                        <div className="bg-white p-6 rounded-2xl border-2 border-zinc-100 shadow-sm">
                            <p className="text-xl font-medium text-zinc-900 leading-relaxed">
                                {question.title}
                            </p>
                        </div>
                    </div>

                    {/* Answers Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            Danh sách đáp án
                        </h3>
                        <div className="grid gap-3">
                            {question.answers?.map((ans, idx) => {
                                const isCorrect = ans.isCorrect;
                                return (
                                    <div
                                        key={idx}
                                        className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${isCorrect
                                            ? 'bg-emerald-50/50 border-emerald-500 shadow-emerald-100 shadow-lg'
                                            : 'bg-white border-zinc-100 hover:border-zinc-200'
                                            }`}
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${isCorrect
                                            ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <p className={`font-medium text-base ${isCorrect ? 'text-emerald-900' : 'text-zinc-600'}`}>
                                                {ans.text}
                                            </p>
                                        </div>
                                        {isCorrect && (
                                            <div className="absolute top-4 right-4">
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-full border border-emerald-200 shadow-sm">
                                                    <CheckIcon className="w-3.5 h-3.5" />
                                                    Đáp án đúng
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-zinc-500">
                        <span>Người tạo: <span className="font-semibold text-zinc-700">{question.createdByName || question.createdBy || "Admin"}</span></span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default function TeacherEditOnlineExamPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [initialValues, setInitialValues] = useState<ExamFormValues | null>(null);

    // Library State
    const [openLibrary, setOpenLibrary] = useState(false);
    const [libraryQuestions, setLibraryQuestions] = useState<Question[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchCategory, setSearchCategory] = useState("");
    const [searchDifficulty, setSearchDifficulty] = useState("");
    const [searchType, setSearchType] = useState("");

    // UI States for Library
    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);

    // Filtered Library Questions
    const [filteredLibraryQuestions, setFilteredLibraryQuestions] = useState<Question[]>([]);

    useEffect(() => {
        let filtered = libraryQuestions;

        if (searchQuery) {
            filtered = filtered.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (searchCategory) {
            filtered = filtered.filter(q => String(q.categoryId) === searchCategory);
        }
        if (searchDifficulty) {
            filtered = filtered.filter(q => q.difficulty === searchDifficulty);
        }
        if (searchType) {
            filtered = filtered.filter(q => q.type === searchType);
        }

        setFilteredLibraryQuestions(filtered);
    }, [libraryQuestions, searchQuery, searchCategory, searchDifficulty, searchType]);


    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Categories
                const cats = await fetchApi("/categories/all");
                setCategories(cats);

                // 2. Fetch Exam Details
                const exam = await fetchApi(`/online-exams/${id}`);

                if (exam.status !== "DRAFT") {
                    toastError("Chỉ có thể chỉnh sửa bài thi ở trạng thái DRAFT");
                    router.push("/teacher/list-exam");
                    return;
                }

                // 3. Map Questions
                let combinedQuestions: Question[] = [];

                if (exam.questions) {
                    combinedQuestions = exam.questions.map((q: any) => ({
                        id: q.id,
                        title: q.title,
                        type: q.type,
                        difficulty: q.difficulty,
                        categoryId: q.category?.id || q.categoryId,
                        categoryName: q.categoryName || q.category?.name,
                        answers: q.answers.map((a: any) => ({ id: a.id, text: a.text, isCorrect: a.isCorrect || a.correct })),
                        isReadOnly: true,
                        createdBy: q.createdBy,
                        visibility: q.visibility
                    }));
                }

                setInitialValues({
                    name: exam.name,
                    level: exam.level,
                    durationMinutes: exam.durationMinutes,
                    passingScore: exam.passingScore,
                    maxParticipants: exam.maxParticipants,
                    categoryId: exam.category?.id || exam.categoryId,
                    questions: combinedQuestions.length > 0 ? combinedQuestions : [
                        {
                            title: "",
                            type: "SINGLE",
                            difficulty: "EASY",
                            categoryId: exam.category?.id || exam.categoryId || "",
                            answers: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }],
                            isReadOnly: false
                        }
                    ]
                });

            } catch (error) {
                console.error("Failed to load data:", error);
                toastError("Không thể tải thông tin bài thi.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, router]);

    // Search Library
    const handleSearchLibrary = async () => {
        try {
            const params = new URLSearchParams();
            // Allow getting all
            params.append("page", "0");
            params.append("size", "1000"); // Fetch ample amount to filter client side or server side

            const data = await fetchApi(`/questions/all?${params.toString()}`);
            const content = data.content ? data.content : data; // Handle pagination vs list response

            const mapped = content.map((q: any) => ({
                id: q.id,
                title: q.title,
                type: q.type,
                difficulty: q.difficulty,
                categoryId: q.category?.id,
                categoryName: q.categoryName || q.category?.name,
                createdBy: q.createdBy,
                answers: q.answers?.map((a: any) => ({
                    id: a.id,
                    text: a.text,
                    isCorrect: a.correct || a.isCorrect
                })) || [],
                isReadOnly: true,
                visibility: q.visibility
            }));
            setLibraryQuestions(mapped);
        } catch (error) {
            console.error("Search error:", error);
            toastError("Lỗi tìm kiếm câu hỏi.");
        }
    };

    const toggleQuestionSelection = (question: Question) => {
        if (selectedQuestions.find(q => q.id === question.id)) {
            setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
        } else {
            setSelectedQuestions([...selectedQuestions, question]);
        }
    };

    // Submit Handler
    const handleSubmit = async (values: ExamFormValues) => {
        try {
            const questionIds: number[] = [];

            // 1. Process Questions
            for (const q of values.questions) {
                if (q.isReadOnly && q.id) {
                    questionIds.push(q.id);
                    continue;
                }

                // Create new manual question
                const payload = {
                    title: q.title,
                    type: q.type,
                    difficulty: q.difficulty,
                    categoryId: q.categoryId || values.categoryId,
                    answers: q.answers.map((a) => ({
                        text: a.text,
                        correct: a.isCorrect,
                    })),
                    visibility: "PRIVATE",
                    createdBy: "TEACHER"
                };

                const savedQ = await fetchApi("/questions/create", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                if (savedQ && savedQ.id) {
                    questionIds.push(savedQ.id);
                }
            }

            // 2. Update Exam Metadata
            await fetchApi(`/online-exams/${id}/update`, {
                method: "PUT",
                body: JSON.stringify({
                    name: values.name,
                    level: values.level,
                    durationMinutes: values.durationMinutes,
                    passingScore: values.passingScore,
                    maxParticipants: values.maxParticipants,
                    categoryId: values.categoryId,
                }),
            });

            // 3. Link Questions
            if (questionIds.length > 0) {
                await fetchApi(`/online-exams/${id}/questions`, {
                    method: "POST",
                    body: JSON.stringify({ questionIds }),
                });
            }

            toastSuccess("Đã cập nhật bài thi online!");
            router.push("/teacher/list-exam");
        } catch (error: any) {
            console.error("Submit error:", error);
            toastError(error.message || "Có lỗi xảy ra khi lưu bài thi.");
        }
    };

    if (loading || !initialValues) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Hero */}
            <div className="relative bg-gradient-to-r from-[#A53AEC] to-fuchsia-600 pb-24 pt-12 shadow-xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black/10 blur-3xl"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-white/80 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Quay lại danh sách
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl">
                            <AcademicCapIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Chỉnh sửa bài thi Online</h1>
                            <p className="text-violet-100 mt-1">Cập nhật thông tin, cấu hình và câu hỏi</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-16 relative z-20">
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ values, setFieldValue, errors, touched }) => (
                        <Form className="space-y-8 max-w-5xl mx-auto">

                            {/* Card: Thông tin cơ bản */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-[#A53AEC] rounded-full"></span>
                                    Thông tin chung
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tên bài thi</label>
                                        <div className="relative">
                                            <Field
                                                name="name"
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                                                placeholder="Nhập tên bài thi..."
                                            />
                                            <PencilSquareIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                        <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                                        <div className="relative">
                                            <Field
                                                as="select"
                                                name="categoryId"
                                                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Chọn danh mục</option>
                                                {categories.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </Field>
                                            <TagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                        <ErrorMessage name="categoryId" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                                        <div className="relative">
                                            <Field
                                                as="select"
                                                name="level"
                                                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Chọn độ khó</option>
                                                <option value="EASY">Dễ</option>
                                                <option value="MEDIUM">Trung bình</option>
                                                <option value="HARD">Khó</option>
                                            </Field>
                                            <SwatchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                        <ErrorMessage name="level" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian (phút)</label>
                                        <div className="relative">
                                            <Field
                                                type="number"
                                                name="durationMinutes"
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                                            />
                                            <ClockIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                        <ErrorMessage name="durationMinutes" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Điểm đạt (trên 10)</label>
                                        <div className="relative">
                                            <Field
                                                type="number"
                                                name="passingScore"
                                                step="0.5"
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                                            />
                                            <ChartBarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                        <ErrorMessage name="passingScore" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Số người tối đa</label>
                                        <div className="relative">
                                            <Field
                                                type="number"
                                                name="maxParticipants"
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                                            />
                                            <UsersIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                        <ErrorMessage name="maxParticipants" component="div" className="text-red-500 text-xs mt-1 ml-1" />
                                    </div>

                                </div>
                            </div>

                            {/* Card: Nội dung bài thi */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-fuchsia-600 rounded-full"></span>
                                        Nội dung bài thi
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpenLibrary(true);
                                            handleSearchLibrary();
                                            setSelectedQuestions([]);
                                        }}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 transition-colors font-medium border border-violet-100"
                                    >
                                        <BookOpenIcon className="w-5 h-5" />
                                        Thêm từ thư viện
                                    </button>
                                </div>

                                <FieldArray name="questions">
                                    {({ push, remove }) => (
                                        <div className="space-y-6">
                                            {values.questions.map((q, qIndex) => (
                                                <div
                                                    key={qIndex}
                                                    className={`
                                                        relative rounded-2xl border p-6 transition-all group
                                                        ${q.isReadOnly ? 'bg-gray-50 border-gray-200 border-dashed' : 'bg-white border-gray-200 hover:border-violet-200 hover:shadow-md'}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
                                                                {qIndex + 1}
                                                            </span>
                                                            <div className="flex flex-col">
                                                                <h3 className="font-semibold text-gray-800">
                                                                    {q.isReadOnly ? 'Câu hỏi thư viện' : 'Câu hỏi tự soạn'}
                                                                </h3>
                                                                {q.isReadOnly && (
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-xs text-gray-500">ID: #{q.id}</span>
                                                                        <span className="text-zinc-300">•</span>
                                                                        <DifficultyBadge difficulty={q.difficulty} />
                                                                        <span className="text-zinc-300">•</span>
                                                                        <TypeBadge type={q.type} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {q.isReadOnly && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDetailQuestion(q)}
                                                                    className="text-gray-400 hover:text-violet-600 p-2 rounded-lg hover:bg-violet-50 transition-colors"
                                                                    title="Xem chi tiết"
                                                                >
                                                                    <EyeIcon className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => remove(qIndex)}
                                                                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                                title="Xóa câu hỏi"
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                                                        <div className="md:col-span-12">
                                                            <Field
                                                                name={`questions.${qIndex}.title`}
                                                                placeholder="Nhập nội dung câu hỏi..."
                                                                disabled={q.isReadOnly}
                                                                className={`w-full px-4 py-3 border rounded-xl outline-none focus:border-violet-500 transition-all ${q.isReadOnly ? 'bg-transparent border-transparent px-0 font-medium text-lg' : 'bg-gray-50 border-gray-200'}`}
                                                            />
                                                            <ErrorMessage name={`questions.${qIndex}.title`} component="div" className="text-red-500 text-xs mt-1" />
                                                        </div>

                                                        {!q.isReadOnly && (
                                                            <>
                                                                <div className="md:col-span-6">
                                                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Loại câu hỏi</label>
                                                                    <Field
                                                                        as="select"
                                                                        name={`questions.${qIndex}.type`}
                                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-violet-500 bg-white"
                                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                                            const newType = e.target.value;
                                                                            setFieldValue(`questions.${qIndex}.type`, newType);
                                                                            if (newType === 'TRUE_FALSE') {
                                                                                setFieldValue(`questions.${qIndex}.answers`, [
                                                                                    { text: "Đúng", isCorrect: false },
                                                                                    { text: "Sai", isCorrect: false }
                                                                                ]);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <option value="SINGLE">Chọn 1 đáp án</option>
                                                                        <option value="MULTIPLE">Chọn nhiều đáp án</option>
                                                                        <option value="TRUE_FALSE">Đúng/Sai</option>
                                                                    </Field>
                                                                </div>

                                                                <div className="md:col-span-6">
                                                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Độ khó</label>
                                                                    <Field
                                                                        as="select"
                                                                        name={`questions.${qIndex}.difficulty`}
                                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-violet-500 bg-white"
                                                                    >
                                                                        <option value="EASY">Dễ</option>
                                                                        <option value="MEDIUM">Trung bình</option>
                                                                        <option value="HARD">Khó</option>
                                                                    </Field>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    <FieldArray name={`questions.${qIndex}.answers`}>
                                                        {({ push: pushAnswer, remove: removeAnswer }) => (
                                                            <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                                                                {q.answers.map((a, aIndex) => (
                                                                    <div key={aIndex} className="flex items-center gap-3 group/answer">
                                                                        <div className="relative flex items-center justify-center">
                                                                            <Field
                                                                                type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                                                                                name={`questions.${qIndex}.answers.${aIndex}.isCorrect`}
                                                                                checked={a.isCorrect}
                                                                                disabled={q.isReadOnly}
                                                                                onChange={() => {
                                                                                    if (q.isReadOnly) return;
                                                                                    if (q.type === "SINGLE" || q.type === "TRUE_FALSE") {
                                                                                        q.answers.forEach((_, idx) => {
                                                                                            setFieldValue(
                                                                                                `questions.${qIndex}.answers.${idx}.isCorrect`,
                                                                                                idx === aIndex
                                                                                            );
                                                                                        });
                                                                                    } else {
                                                                                        setFieldValue(
                                                                                            `questions.${qIndex}.answers.${aIndex}.isCorrect`,
                                                                                            !a.isCorrect
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                className="peer sr-only"
                                                                            />
                                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${a.isCorrect
                                                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                                : 'bg-white border-gray-300 text-transparent hover:border-violet-400 cursor-pointer'
                                                                                }`}>
                                                                                <CheckIcon className="w-4 h-4" />
                                                                            </div>
                                                                        </div>

                                                                        <Field
                                                                            name={`questions.${qIndex}.answers.${aIndex}.text`}
                                                                            placeholder={`Đáp án ${aIndex + 1}`}
                                                                            disabled={q.isReadOnly}
                                                                            className={`flex-1 px-3 py-2 border rounded-lg outline-none focus:border-violet-500 transition-all ${q.isReadOnly
                                                                                ? 'bg-transparent border-transparent px-0 text-gray-600'
                                                                                : 'bg-white border-gray-200'
                                                                                } ${a.isCorrect && q.isReadOnly ? 'text-emerald-700 font-bold' : ''}`}
                                                                        />

                                                                        {!q.isReadOnly && q.type !== 'TRUE_FALSE' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeAnswer(aIndex)}
                                                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover/answer:opacity-100 transition-all p-1"
                                                                            >
                                                                                <XMarkIcon className="w-5 h-5" />
                                                                            </button>
                                                                        )}

                                                                        {q.isReadOnly && a.isCorrect && (
                                                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Đúng</span>
                                                                        )}
                                                                    </div>
                                                                ))}

                                                                {!q.isReadOnly && q.type !== 'TRUE_FALSE' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => pushAnswer({ text: "", isCorrect: false })}
                                                                        className="mt-2 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 w-fit"
                                                                    >
                                                                        <PlusCircleIcon className="w-4 h-4" />
                                                                        Thêm đáp án
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </FieldArray>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => push({
                                                    title: "",
                                                    type: "SINGLE",
                                                    difficulty: "EASY",
                                                    categoryId: values.categoryId || categories[0]?.id || "",
                                                    answers: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }],
                                                    isReadOnly: false,
                                                    createdBy: "TEACHER"
                                                })}
                                                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all flex flex-col items-center justify-center gap-2 group"
                                            >
                                                <div className="p-3 bg-gray-50 rounded-full group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <PlusCircleIcon className="w-8 h-8" />
                                                </div>
                                                Thêm câu hỏi thủ công
                                            </button>
                                        </div>
                                    )}
                                </FieldArray>
                            </div>

                            {/* Action Bar */}
                            <div className="sticky bottom-4 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white/50 flex justify-between items-center z-40">
                                <div className="text-sm text-gray-500 pl-2">
                                    Đang có <span className="font-bold text-gray-900">{values.questions.length}</span> câu hỏi
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#A53AEC] to-fuchsia-600 text-white font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </div>

                            {/* Library Modal */}
                            {openLibrary && typeof window !== 'undefined' && createPortal(
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                                        {/* Modal Header */}
                                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                                    <BookOpenIcon className="w-7 h-7 text-violet-600" />
                                                    Thư viện câu hỏi
                                                </h2>
                                                <p className="text-gray-500 mt-1">Chọn câu hỏi từ ngân hàng để thêm vào bài thi</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                                    <button
                                                        onClick={() => setViewMode('grid')}
                                                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >
                                                        <Squares2X2Icon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setViewMode('list')}
                                                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >
                                                        <ListBulletIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenLibrary(false)}
                                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    <XMarkIcon className="w-8 h-8" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Search & Filter Bar */}
                                        <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 shrink-0 space-y-4">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="relative flex-1">
                                                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                                    <input
                                                        placeholder="Tìm kiếm câu hỏi..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchLibrary()}
                                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="relative w-full md:w-64 shrink-0">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <FolderIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <select
                                                        value={searchCategory}
                                                        onChange={(e) => setSearchCategory(e.target.value)}
                                                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none appearance-none cursor-pointer hover:border-violet-300 transition-all shadow-sm truncate"
                                                    >
                                                        <option value="">Tất cả danh mục</option>
                                                        {categories.map((cat) => (
                                                            <option key={cat.id} value={cat.id}>
                                                                {cat.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleSearchLibrary}
                                                    className="px-8 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 shrink-0"
                                                >
                                                    Tìm kiếm
                                                </button>
                                            </div>

                                            {/* Advanced Filters */}
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">

                                                    {/* Difficulty Filters */}
                                                    <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm shrink-0">
                                                        <span className="text-xs font-semibold text-gray-500 px-2 uppercase">Độ khó</span>
                                                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                                        {['Easy', 'Medium', 'Hard'].map((diff) => (
                                                            <button
                                                                key={diff}
                                                                type="button"
                                                                onClick={() => setSearchDifficulty(searchDifficulty === diff.toUpperCase() ? '' : diff.toUpperCase())}
                                                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ml-1 ${searchDifficulty === diff.toUpperCase()
                                                                    ? diff === 'Easy' ? 'bg-green-100 text-green-700 ring-1 ring-green-500' :
                                                                        diff === 'Medium' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-500' :
                                                                            'bg-red-100 text-red-700 ring-1 ring-red-500'
                                                                    : 'text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {diff === 'Easy' ? 'Dễ' : diff === 'Medium' ? 'TB' : 'Khó'}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Type Filters */}
                                                    <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm shrink-0">
                                                        <span className="text-xs font-semibold text-gray-500 px-2 uppercase">Loại</span>
                                                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                                        {['SINGLE', 'MULTIPLE', 'TRUE_FALSE'].map((type) => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => setSearchType(searchType === type ? '' : type)}
                                                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ml-1 ${searchType === type
                                                                    ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-500'
                                                                    : 'text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {type === 'SINGLE' ? 'Đơn' : type === 'MULTIPLE' ? 'Nhiều' : 'Đ/S'}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="flex-1"></div>

                                                    {selectedQuestions.length > 0 && (
                                                        <button
                                                            onClick={() => setSelectedQuestions([])}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors whitespace-nowrap"
                                                        >
                                                            Bỏ chọn ({selectedQuestions.length})
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Body */}
                                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                                            {filteredLibraryQuestions.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                                    <MagnifyingGlassIcon className="w-24 h-24 mb-4" />
                                                    <p className="text-xl font-medium">Không tìm thấy câu hỏi nào</p>
                                                    <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                                </div>
                                            ) : (
                                                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                                                    {filteredLibraryQuestions
                                                        .filter(q => !values.questions.some(cq => cq.id === q.id))
                                                        .map((q) => {
                                                            const isSelected = selectedQuestions.some(sq => sq.id === q.id);
                                                            return (
                                                                <div
                                                                    key={q.id}
                                                                    onClick={() => toggleQuestionSelection(q)}
                                                                    className={`
                                                                        relative group cursor-pointer bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden
                                                                        ${isSelected
                                                                            ? 'border-violet-500 shadow-lg shadow-violet-100 ring-2 ring-violet-500/20'
                                                                            : 'border-transparent shadow-sm hover:shadow-md hover:border-violet-200'
                                                                        }
                                                                        ${viewMode === 'list' ? 'flex items-center p-4 gap-6' : 'flex flex-col p-6'}
                                                                    `}
                                                                >
                                                                    {/* Selection Checkbox overlay */}
                                                                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-gray-300 bg-white'}`}>
                                                                        {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                                                                    </div>

                                                                    {/* Badges */}
                                                                    <div className={`flex gap-2 mb-4 ${viewMode === 'list' ? 'mb-0 w-48 shrink-0 flex-col gap-1' : ''}`}>
                                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold w-fit ${q.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                                                                            q.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                                                'bg-red-100 text-red-700'
                                                                            }`}>
                                                                            {q.difficulty === "EASY" ? "Dễ" : q.difficulty === "MEDIUM" ? "Trung bình" : "Khó"}
                                                                        </span>
                                                                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold w-fit">
                                                                            {q.type === "SINGLE" ? "Đơn" : q.type === "MULTIPLE" ? "Đa" : "Đ/S"}
                                                                        </span>
                                                                    </div>

                                                                    {/* Content */}
                                                                    <div className="flex-1">
                                                                        <div className="flex justify-between items-start gap-2 mb-2">
                                                                            <h3 className="font-bold text-gray-800 line-clamp-3 group-hover:text-violet-700 transition-colors">
                                                                                {q.title}
                                                                            </h3>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setDetailQuestion(q);
                                                                                }}
                                                                                className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors shrink-0"
                                                                                title="Xem chi tiết"
                                                                            >
                                                                                <EyeIcon className="w-5 h-5" />
                                                                            </button>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500">
                                                                            {q.categoryName || "Chưa phân loại"} • {q.createdBy || "System"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                                            <div className="text-sm font-medium text-gray-600">
                                                Đã chọn: <span className="text-violet-600 font-bold text-lg">{selectedQuestions.length}</span> câu hỏi
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenLibrary(false)}
                                                    className="px-6 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                                >
                                                    Đóng
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={selectedQuestions.length === 0}
                                                    onClick={() => {
                                                        const currentQuestions = values.questions;
                                                        // Filter out dupes just in case
                                                        const newQuestions = selectedQuestions.filter(sq => !currentQuestions.some(cq => cq.id === sq.id));
                                                        setFieldValue("questions", [...currentQuestions, ...newQuestions]);
                                                        toastSuccess(`Đã thêm ${newQuestions.length} câu hỏi vào bài thi!`);
                                                        setSelectedQuestions([]);
                                                        setOpenLibrary(false);
                                                    }}
                                                    className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#A53AEC] to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                                                >
                                                    Thêm vào bài thi
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>,
                                document.body
                            )}

                        </Form>
                    )}
                </Formik>

                {/* Detail Modal */}
                <QuestionDetailModal question={detailQuestion} onClose={() => setDetailQuestion(null)} />
            </div>
        </div>
    );
}
