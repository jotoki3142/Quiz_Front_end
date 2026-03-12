"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    EyeIcon,
    FunnelIcon,
    QuestionMarkCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    GlobeAsiaAustraliaIcon,
    LockClosedIcon,
    UserIcon,
    ChevronDownIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'; // Using outline icons for consistency

// --- Interfaces ---

interface Answer {
    text: string;
    correct: boolean;
}

interface Question {
    id: number;
    title: string;
    type: string;
    difficulty: string;
    visibility: string;
    categoryId: number;
    categoryName?: string;
    answers?: Answer[];
    correctAnswer?: string; // Sometimes returned as string for simple types
    createdBy?: string;
    createdByName?: string;
    createdByRole?: string;
}

interface Category {
    id: number;
    name: string;
}

interface UserProfile {
    username: string;
    email: string;
    role: string;
}

// --- Utils ---

const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('jwt');
    }
    return null;
};

async function fetchApi(url: string, options: any = {}) {
    const token = getAuthToken();
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const config: any = {
        method: options.method || 'GET',
        headers: { ...defaultHeaders, ...(options.headers || {}) },
    };

    if (options.body) config.body = JSON.stringify(options.body);
    const fullUrl = url.startsWith('/api') ? url : (url.startsWith('/') ? `/api${url}` : `/api/${url}`);

    const response = await fetch(fullUrl, config);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        throw new Error(data.message || response.statusText || "Lỗi không xác định");
    }
    return data;
}

// --- Components ---

const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
    switch (difficulty) {
        case 'EASY':
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Dễ</span>;
        case 'MEDIUM':
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Trung bình</span>;
        case 'HARD':
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">Khó</span>;
        default:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">{difficulty}</span>;
    }
};

const TypeBadge = ({ type }: { type: string }) => {
    const map: Record<string, string> = {
        'SINGLE': 'Một đáp án',
        'MULTIPLE': 'Nhiều đáp án',
        'TRUE_FALSE': 'Đúng / Sai'
    };
    return <span className="text-zinc-600 font-medium text-sm">{map[type] || type}</span>;
};

const VisibilityBadge = ({ visibility }: { visibility: string }) => {
    if (visibility === 'PUBLIC') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-sky-100 text-sky-700 border border-sky-200">
                <GlobeAsiaAustraliaIcon className="w-3 h-3" /> Công khai
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
            <LockClosedIcon className="w-3 h-3" /> Riêng tư
        </span>
    );
};


// --- Modals ---

const QuestionModal = ({
    isOpen,
    onClose,
    onSave,
    editingQuestion,
    categories,
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    editingQuestion: Question | null;
    categories: Category[];
    loading: boolean;
}) => {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [visibility, setVisibility] = useState("PRIVATE");
    const [answers, setAnswers] = useState<Answer[]>([{ text: "", correct: false }, { text: "", correct: false }]);

    useEffect(() => {
        if (isOpen) {
            if (editingQuestion) {
                setTitle(editingQuestion.title);
                setType(editingQuestion.type);
                setDifficulty(editingQuestion.difficulty);
                setCategoryId(String(editingQuestion.categoryId));
                setVisibility(editingQuestion.visibility || "PRIVATE");
                setAnswers(editingQuestion.answers || [{ text: "", correct: false }, { text: "", correct: false }]);
            } else {
                setTitle("");
                setType("");
                setDifficulty("");
                setCategoryId("");
                setVisibility("PRIVATE");
                setAnswers([{ text: "", correct: false }, { text: "", correct: false }]);
            }
        }
    }, [isOpen, editingQuestion]);

    // Answer logic
    const handleAnswerChange = (idx: number, field: keyof Answer, value: any) => {
        const newAnswers = [...answers];
        if (field === 'correct') {
            if (type === 'SINGLE' || type === 'TRUE_FALSE') {
                newAnswers.forEach(a => a.correct = false); // Reset others
            }
        }
        (newAnswers[idx] as any)[field] = value;
        setAnswers(newAnswers);
    };

    const addAnswer = () => setAnswers([...answers, { text: "", correct: false }]);
    const removeAnswer = (idx: number) => {
        if (answers.length > 2) setAnswers(answers.filter((_, i) => i !== idx));
    };

    // Auto preset answers for True/False
    useEffect(() => {
        if (!editingQuestion && type === 'TRUE_FALSE') {
            setAnswers([{ text: "Đúng", correct: true }, { text: "Sai", correct: false }]);
        }
    }, [type, editingQuestion]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({
            title, type, difficulty, categoryId, visibility, answers
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center px-8 py-6 border-b border-zinc-100 shrink-0">
                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        {editingQuestion ? <PencilSquareIcon className="w-6 h-6 text-violet-600" /> : <PlusIcon className="w-6 h-6 text-violet-600" />}
                        {editingQuestion ? "Cập nhật câu hỏi" : "Thêm câu hỏi mới"}
                    </h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tiêu đề câu hỏi <span className="text-rose-500">*</span></label>
                            <textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium resize-none"
                                placeholder="Nhập nội dung câu hỏi..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Loại câu hỏi</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium appearance-none"
                                required
                            >
                                <option value="">Chọn loại...</option>
                                <option value="SINGLE">Một đáp án</option>
                                <option value="MULTIPLE">Nhiều đáp án</option>
                                <option value="TRUE_FALSE">Đúng / Sai</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Độ khó</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium appearance-none"
                                required
                            >
                                <option value="">Chọn độ khó...</option>
                                <option value="EASY">Dễ</option>
                                <option value="MEDIUM">Trung bình</option>
                                <option value="HARD">Khó</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Danh mục</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium appearance-none"
                                required
                            >
                                <option value="">Chọn danh mục...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Hiển thị</label>
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium appearance-none"
                            >
                                <option value="PRIVATE">Riêng tư</option>
                                <option value="PUBLIC">Công khai</option>
                            </select>
                        </div>
                    </div>

                    {/* Answers Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Đáp án</label>
                            {type !== 'TRUE_FALSE' && (
                                <button type="button" onClick={addAnswer} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                                    <PlusIcon className="w-3 h-3" /> Thêm
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {answers.map((ans, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div
                                        onClick={() => handleAnswerChange(idx, 'correct', !ans.correct)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${ans.correct ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-zinc-200 text-zinc-300 hover:border-emerald-300'}`}
                                    >
                                        <CheckCircleIcon className="w-6 h-6" />
                                    </div>
                                    <input
                                        type="text"
                                        value={ans.text}
                                        onChange={(e) => handleAnswerChange(idx, 'text', e.target.value)}
                                        placeholder={`Đáp án ${idx + 1}`}
                                        className={`flex-1 px-4 py-2.5 rounded-xl border ${ans.correct ? 'border-emerald-200 bg-emerald-50/50' : 'border-zinc-200 bg-white'} focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all text-sm`}
                                        readOnly={type === 'TRUE_FALSE'}
                                    />
                                    {type !== 'TRUE_FALSE' && answers.length > 2 && (
                                        <button type="button" onClick={() => removeAnswer(idx)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-zinc-400">
                            Click vào icon bên trái để đánh dấu đáp án đúng. {type === 'SINGLE' && 'Chỉ được chọn 1 đáp án đúng.'}
                        </p>
                    </div>

                </form>

                <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors" disabled={loading}>Hủy</button>
                    <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-200 disabled:opacity-70" disabled={loading}>
                        {loading ? "Đang lưu..." : (editingQuestion ? "Cập nhật" : "Tạo mới")}
                    </button>
                </div>
            </div>
        </div>
    );
};

const QuestionDetailModal = ({ question, onClose }: { question: Question | null, onClose: () => void }) => {
    if (!question) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm" onClick={onClose}>
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
                                {question.categoryName}
                            </span>
                        </div>
                    </div>

                    {/* Question Content */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Nội dung câu hỏi
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
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Danh sách đáp án
                        </h3>
                        <div className="grid gap-3">
                            {question.answers?.map((ans, idx) => (
                                <div
                                    key={idx}
                                    className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${ans.correct
                                        ? 'bg-emerald-50/50 border-emerald-500 shadow-emerald-100 shadow-lg'
                                        : 'bg-white border-zinc-100 hover:border-zinc-200'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${ans.correct
                                        ? 'bg-emerald-500 text-white border-emerald-500'
                                        : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className={`font-medium text-base ${ans.correct ? 'text-emerald-900' : 'text-zinc-600'}`}>
                                            {ans.text}
                                        </p>
                                    </div>
                                    {ans.correct && (
                                        <div className="absolute top-4 right-4">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-full border border-emerald-200 shadow-sm">
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                Đáp án đúng
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-zinc-500">
                        <UserIcon className="w-4 h-4" />
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
        </div>
    );
};


const DeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    questionTitle,
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    questionTitle: string;
    loading: boolean;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Xác nhận xóa</h3>
                <p className="text-zinc-500 mb-6">
                    Bạn có chắc chắn muốn xóa câu hỏi <span className="font-bold text-zinc-900">"{questionTitle}"</span>?
                    Hành động này không thể hoàn tác.
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors w-full"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-200 w-full disabled:opacity-70"
                        disabled={loading}
                    >
                        {loading ? "Đang xóa..." : "Xóa"}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Page ---

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);

    // Filters
    const [keyword, setKeyword] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [visibilityFilter, setVisibilityFilter] = useState("");

    // Pagination
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const PAGE_SIZE = 10;

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

    // Initial Load
    useEffect(() => {
        fetchApi('/categories/all').then(data => {
            const content = Array.isArray(data) ? data : data?.content || [];
            setCategories(content);
        }).catch(console.error);
    }, []);

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                size: String(PAGE_SIZE),
                sort: "id,desc",
            });
            if (keyword.trim()) params.append("q", keyword.trim());
            if (typeFilter) params.append("type", typeFilter);
            if (difficultyFilter) params.append("difficulty", difficultyFilter);
            if (categoryFilter) params.append("categoryId", categoryFilter);
            if (visibilityFilter) params.append("visibility", visibilityFilter);

            const data = await fetchApi(`/questions/search?${params.toString()}`);
            const content = Array.isArray(data?.content) ? data.content : data || [];

            setQuestions(content);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || content.length);

        } catch (error: any) {
            toast.error(error.message || "Lỗi tải dữ liệu");
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }, [page, keyword, typeFilter, difficultyFilter, categoryFilter, visibilityFilter]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleSearch = () => {
        setPage(0);
        fetchQuestions(); // Should trigger by useEffect anyway if keyword changed but for enter key
    };

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [typeFilter, difficultyFilter, categoryFilter, visibilityFilter]);

    const handleSave = async (data: any) => {
        setLoading(true);
        try {
            // Transform answers to ensure correct format
            const validAnswers = data.answers.filter((a: any) => a.text.trim());

            // Validation
            if (validAnswers.length === 0) {
                toast.error("Vui lòng nhập ít nhất một đáp án");
                setLoading(false);
                return;
            }

            const correctCount = validAnswers.filter((a: any) => a.correct).length;
            if (data.type === 'SINGLE' && correctCount !== 1) {
                toast.error("Câu hỏi Một đáp án phải có duy nhất 1 đáp án đúng");
                setLoading(false);
                return;
            }
            if (data.type === 'MULTIPLE' && correctCount < 2) {
                toast.error("Câu hỏi Nhiều đáp án phải có ít nhất 2 đáp án đúng");
                setLoading(false);
                return;
            }
            if (data.type === 'TRUE_FALSE' && correctCount !== 1) {
                toast.error("Câu hỏi Đúng/Sai phải có 1 đáp án đúng");
                setLoading(false);
                return;
            }

            const payload = {
                ...data,
                answers: validAnswers,
                correctAnswer: validAnswers.find((a: any) => a.correct)?.text || "" // Legacy support
            };

            if (editingQuestion) {
                await fetchApi(`/questions/edit/${editingQuestion.id}`, { method: 'PATCH', body: payload });
                toast.success("Cập nhật thành công");
            } else {
                await fetchApi(`/questions/create`, { method: 'POST', body: payload });
                toast.success("Tạo mới thành công");
            }
            setIsEditModalOpen(false);
            fetchQuestions();

        } catch (error: any) {
            toast.error(error.message || "Lưu thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (question: Question) => {
        setDeletingQuestion(question);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingQuestion) return;
        setLoading(true);
        try {
            await fetchApi(`/questions/delete/${deletingQuestion.id}`, { method: 'DELETE' });
            toast.success("Đã xóa câu hỏi");
            fetchQuestions();
            setIsDeleteModalOpen(false);
            setDeletingQuestion(null);
        } catch (error: any) {
            toast.error(error.message || "Xóa thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="space-y-6">

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-xl shadow-violet-200 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black/10 blur-3xl"></div>

                    <div className="relative p-8 text-white">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                    <QuestionMarkCircleIcon className="w-10 h-10 text-violet-200" />
                                    Quản lý Câu hỏi
                                </h1>
                                <p className="text-violet-100 mt-2 text-lg opacity-90 max-w-2xl">
                                    Ngân hàng câu hỏi của hệ thống. Tạo, chỉnh sửa và quản lý các câu hỏi cho bài thi.
                                </p>
                            </div>
                            <div className="px-5 py-2.5 rounded-2xl bg-white backdrop-blur-md border border-white/30 font-bold shadow-lg text-violet-700">
                                {totalElements} <span className="text-violet-500 font-medium ml-1">câu hỏi</span>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="mt-8 p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex flex-col xl:flex-row gap-3">
                            {/* Keyword */}
                            <div className="relative flex-1 min-w-[200px] group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                </div>
                                <input
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="Tìm nội dung..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all text-sm font-medium shadow-sm"
                                />
                            </div>

                            {/* Dropdowns Group */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-auto">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FunnelIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                    </div>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="w-full pl-10 pr-8 py-3 rounded-xl bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 text-zinc-900 text-sm font-medium focus:outline-none appearance-none cursor-pointer hover:bg-zinc-50 transition-colors shadow-sm"
                                    >
                                        <option value="">Tất cả loại</option>
                                        <option value="SINGLE">Một đáp án</option>
                                        <option value="MULTIPLE">Nhiều đáp án</option>
                                        <option value="TRUE_FALSE">Đúng / Sai</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FunnelIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                    </div>
                                    <select
                                        value={difficultyFilter}
                                        onChange={(e) => setDifficultyFilter(e.target.value)}
                                        className="w-full pl-10 pr-8 py-3 rounded-xl bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 text-zinc-900 text-sm font-medium focus:outline-none appearance-none cursor-pointer hover:bg-zinc-50 transition-colors shadow-sm"
                                    >
                                        <option value="">Tất cả độ khó</option>
                                        <option value="EASY">Dễ</option>
                                        <option value="MEDIUM">Trung bình</option>
                                        <option value="HARD">Khó</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FunnelIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                    </div>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full pl-10 pr-8 py-3 rounded-xl bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 text-zinc-900 text-sm font-medium focus:outline-none appearance-none cursor-pointer hover:bg-zinc-50 transition-colors shadow-sm"
                                    >
                                        <option value="">Tất cả danh mục</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FunnelIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                    </div>
                                    <select
                                        value={visibilityFilter}
                                        onChange={(e) => setVisibilityFilter(e.target.value)}
                                        className="w-full pl-10 pr-8 py-3 rounded-xl bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 text-zinc-900 text-sm font-medium focus:outline-none appearance-none cursor-pointer hover:bg-zinc-50 transition-colors shadow-sm"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="PUBLIC">Công khai</option>
                                        <option value="PRIVATE">Riêng tư</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => { setEditingQuestion(null); setIsEditModalOpen(true); }}
                                className="px-6 py-3 rounded-xl bg-white text-violet-700 font-bold shadow-lg hover:bg-violet-50 transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="w-5 h-5" /> Thêm câu hỏi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-600">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs w-16 whitespace-nowrap">STT</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs">Nội dung câu hỏi</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs whitespace-nowrap">Loại</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs whitespace-nowrap">Độ khó</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs whitespace-nowrap">Danh mục</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs whitespace-nowrap">Trạng thái</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs text-right whitespace-nowrap">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 w-8 bg-zinc-100 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-64 bg-zinc-100 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-100 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-100 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-100 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-100 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-100 rounded ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : questions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                                            <QuestionMarkCircleIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                            <p className="text-lg font-semibold text-zinc-600">Không tìm thấy câu hỏi nào</p>
                                            <p>Thử thay đổi bộ lọc hoặc thêm câu hỏi mới.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    questions.map((q, idx) => (
                                        <tr key={q.id} className="group hover:bg-violet-50/40 transition-colors">
                                            <td className="px-6 py-4 font-medium text-zinc-400">{page * PAGE_SIZE + idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xl">
                                                    <p className="font-bold text-zinc-800 line-clamp-2 group-hover:text-violet-700 transition-colors cursor-pointer" onClick={() => setDetailQuestion(q)}>
                                                        {q.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded font-medium">{q.createdByName || q.createdBy || "Admin"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap"><TypeBadge type={q.type} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><DifficultyBadge difficulty={q.difficulty} /></td>
                                            <td className="px-6 py-4 font-medium text-zinc-600 whitespace-nowrap">{q.categoryName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><VisibilityBadge visibility={q.visibility} /></td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setDetailQuestion(q)} className="p-2 rounded-lg text-sky-600 hover:bg-sky-100 transition-colors" title="Xem chi tiết">
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => { setEditingQuestion(q); setIsEditModalOpen(true); }} className="p-2 rounded-lg text-violet-600 hover:bg-violet-100 transition-colors" title="Sửa">
                                                        <PencilSquareIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(q)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors" title="Xóa">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && questions.length > 0 && (
                        <div className="px-6 py-5 border-t border-zinc-100 bg-zinc-50/50 flex flex-col md:grid md:grid-cols-3 items-center gap-4">
                            {/* 1. Summary Text (Left) */}
                            <div className="w-full md:text-left text-center order-2 md:order-1">
                                <p className="text-sm text-zinc-500">
                                    Hiển thị <span className="font-medium text-zinc-900">{page * PAGE_SIZE + 1}</span> đến{' '}
                                    <span className="font-medium text-zinc-900">
                                        {Math.min((page + 1) * PAGE_SIZE, totalElements)}
                                    </span>{' '}
                                    trong tổng số <span className="font-medium text-zinc-900">{totalElements}</span> kết quả
                                </p>
                            </div>

                            {/* 2. Pagination Buttons (Center) */}
                            <div className="flex items-center justify-center gap-1 order-1 md:order-2 w-full">
                                <button
                                    onClick={() => setPage(0)}
                                    disabled={page === 0}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent transition-all"
                                >
                                    <span className="sr-only">First</span>
                                    «
                                </button>
                                <button
                                    onClick={() => setPage(Math.max(0, page - 1))}
                                    disabled={page === 0}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent transition-all"
                                >
                                    <span className="sr-only">Previous</span>
                                    ‹
                                </button>

                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let p = i;
                                        if (totalPages > 5) {
                                            if (page > 2) p = page - 2 + i;
                                            if (p >= totalPages) p = totalPages - (5 - i);
                                        }
                                        if (p < 0) p = 0;

                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${page === p
                                                    ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                                    : "text-zinc-600 hover:bg-white hover:shadow-sm hover:border-zinc-200 border border-transparent"
                                                    }`}
                                            >
                                                {p + 1}
                                            </button>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                    disabled={page === totalPages - 1}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent transition-all"
                                >
                                    <span className="sr-only">Next</span>
                                    ›
                                </button>
                                <button
                                    onClick={() => setPage(totalPages - 1)}
                                    disabled={page === totalPages - 1}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent transition-all"
                                >
                                    <span className="sr-only">Last</span>
                                    »
                                </button>
                            </div>

                            {/* 3. Empty Spacer (Right) */}
                            <div className="hidden md:block order-3"></div>
                        </div>
                    )}
                </div>
            </div>

            <QuestionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSave}
                editingQuestion={editingQuestion}
                categories={categories}
                loading={loading}
            />

            <QuestionDetailModal
                question={detailQuestion}
                onClose={() => setDetailQuestion(null)}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                questionTitle={deletingQuestion?.title || ""}
                loading={loading}
            />
        </div>
    );
}
