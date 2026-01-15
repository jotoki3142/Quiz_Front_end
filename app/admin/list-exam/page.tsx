"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    EyeIcon,
    ClockIcon,
    CalendarIcon,
    EllipsisHorizontalIcon,
    ShareIcon,
    PlayIcon,
    AcademicCapIcon,
    FunnelIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    QrCodeIcon,
    LinkIcon,
    ChartBarIcon,
    DocumentTextIcon,
    GlobeAltIcon,
    ComputerDesktopIcon,
    TagIcon,
} from "@heroicons/react/24/outline";

interface Exam {
    examId: number;
    title: string;
    startTime: string;
    endTime: string;
    questionCount: number;
    examQuestions: {
        question: {
            difficulty: string;
        };
    }[];
    category?: {
        id: number;
        name: string;
    };
    status?: "DRAFT" | "PUBLISHED";
    durationMinutes: number;
    examLevel?: string;
}

// --- Components ---

const StatusBadge = ({ status, type }: { status?: string, type: 'offline' | 'online' }) => {
    if (type === 'offline') {
        if (status === 'DRAFT') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Bản nháp</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Công khai</span>;
    } else {
        // Online status
        switch (status) {
            case 'DRAFT': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Nháp</span>;
            case 'WAITING': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">Đang chờ</span>;
            case 'IN_PROGRESS': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">Đang diễn ra</span>;
            case 'FINISHED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">Đã kết thúc</span>;
            default: return null;
        }
    }
};

const DifficultyBadge = ({ level }: { level?: string }) => {
    switch (level) {
        case "EASY": return <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Dễ</span>;
        case "MEDIUM": return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">Trung bình</span>;
        case "HARD": return <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">Khó</span>;
        default: return <span className="text-xs font-medium text-zinc-400 bg-zinc-50 px-2 py-1 rounded-md">--</span>;
    }
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, loading }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, loading?: boolean }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Xác nhận xóa</h3>
                <p className="text-zinc-500 mb-6">
                    Bạn có chắc chắn muốn xóa bài thi <span className="font-bold text-zinc-900">"{title}"</span>?
                    Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3 justify-center">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors w-full">Hủy</button>
                    <button onClick={onConfirm} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-lg shadow-rose-200 w-full disabled:opacity-70" disabled={loading}>
                        {loading ? "Đang xóa..." : "Xóa"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function AdminExamListPage() {
    const pathname = usePathname();
    const router = useRouter();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMenu, setOpenMenu] = useState<number | string | null>(null);
    const [openShare, setOpenShare] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [activeTab, setActiveTab] = useState<"link" | "qr">("link");

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [examLevel, setExamLevel] = useState("");
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

    // Online Exams State
    const [onlineExams, setOnlineExams] = useState<any[]>([]);

    // Delete State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ id: number, type: 'offline' | 'online', title: string } | null>(null);

    // Fetch Categories
    useEffect(() => {
        fetchApi("/categories/all").then(setCategories).catch(console.error);
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append("title", searchQuery);
            if (categoryId) params.append("categoryId", categoryId);
            if (examLevel) params.append("examLevel", examLevel);

            const response = await fetchApi(`/exams/search?${params.toString()}`);
            setExams(response.content || []);
        } catch (error) {
            console.error("Failed to fetch exams:", error);
            toastError("Không thể tải danh sách bài thi.");
        } finally {
            setLoading(false);
        }
    };

    const fetchOnlineExams = async () => {
        try {
            const response = await fetchApi("/online-exams/all");
            setOnlineExams(response || []);
        } catch (error) {
            console.error("Failed to fetch online exams:", error);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchExams();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, categoryId, examLevel]);

    useEffect(() => {
        fetchOnlineExams();
    }, []);

    // Helper: exam has ended (based on endTime)
    const isExamEnded = (exam: Exam) => {
        if (!exam.endTime) return false;
        const end = new Date(exam.endTime);
        if (isNaN(end.getTime())) return false;
        return end < new Date();
    };

    // Filter Logic
    const sortedExams = [...exams]
        .filter((e) => !isExamEnded(e))
        .sort((a, b) => Number(new Date(b.startTime || 0)) - Number(new Date(a.startTime || 0)));

    const draftOfflineExams = sortedExams.filter((x) => x.status === 'DRAFT');
    const readyExams = sortedExams.filter((x) => x.status === 'PUBLISHED');

    const finishedOfflineExams = [...exams]
        .filter((e) => isExamEnded(e))
        .sort((a, b) => Number(new Date(b.endTime || 0)) - Number(new Date(a.endTime || 0)));

    const finishedOnlineExams = onlineExams.filter((e) => e.status === 'FINISHED');
    const draftOnlineExams = onlineExams.filter((e) => e.status === 'DRAFT');
    const activeOnlineExams = onlineExams.filter((e) => e.status !== 'FINISHED' && e.status !== 'DRAFT');

    const confirmDelete = (id: number, type: 'offline' | 'online', title: string) => {
        setDeletingItem({ id, type, title });
        setDeleteModalOpen(true);
        setOpenMenu(null);
    };

    const performDelete = async () => {
        if (!deletingItem) return;
        try {
            if (deletingItem.type === 'offline') {
                await fetchApi(`/exams/delete/${deletingItem.id}`, { method: "DELETE" });
                setExams(exams.filter((e) => e.examId !== deletingItem.id));
                toastSuccess("Đã xóa bài thi thành công");
            } else {
                await fetchApi(`/online-exams/${deletingItem.id}`, { method: 'DELETE' });
                toastSuccess("Đã xóa bài thi online");
                fetchOnlineExams();
            }
            setDeleteModalOpen(false);
            setDeletingItem(null);
        } catch (error: any) {
            toastError(error.message || "Không thể xóa bài thi.");
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="min-h-screen">
            <div className="space-y-6">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-xl shadow-violet-200 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black/10 blur-3xl"></div>

                    <div className="relative p-8 text-white">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                    <AcademicCapIcon className="w-10 h-10 text-violet-200" />
                                    Quản lý Bài thi
                                </h1>
                                <p className="text-violet-100 mt-2 text-lg opacity-90 max-w-2xl">
                                    Tạo và quản lý các bài kiểm tra, kỳ thi online và offline cho học viên.
                                </p>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="flex p-1 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                                <button onClick={() => router.push("/admin/list-exam")} className="px-4 py-2 rounded-lg bg-white text-violet-700 font-bold shadow-sm transition-all text-sm">
                                    Bài thi
                                </button>
                                <button onClick={() => router.push("/admin/history-exam")} className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all text-sm font-medium">
                                    Lịch sử Offline
                                </button>
                                <button onClick={() => router.push("/admin/history-exam-online")} className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all text-sm font-medium">
                                    Lịch sử Online
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="mt-8 p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1 min-w-[200px] group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                </div>
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm bài thi..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm font-medium shadow-sm"
                                />
                            </div>

                            <div className="flex flex-1 gap-2">
                                <div className="relative flex-1">
                                    <select
                                        className="w-full pl-3 pr-10 py-3 rounded-xl bg-white border-0 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium appearance-none cursor-pointer shadow-sm"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                    >
                                        <option value="" className="text-zinc-900">Tất cả danh mục</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id} className="text-zinc-900">{c.name}</option>
                                        ))}
                                    </select>
                                    <FunnelIcon className="w-5 h-5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <select
                                        className="w-full pl-3 pr-10 py-3 rounded-xl bg-white border-0 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium appearance-none cursor-pointer shadow-sm"
                                        value={examLevel}
                                        onChange={(e) => setExamLevel(e.target.value)}
                                    >
                                        <option value="" className="text-zinc-900">Tất cả độ khó</option>
                                        <option value="EASY" className="text-zinc-900">Dễ</option>
                                        <option value="MEDIUM" className="text-zinc-900">Trung bình</option>
                                        <option value="HARD" className="text-zinc-900">Khó</option>
                                    </select>
                                    <DocumentTextIcon className="w-5 h-5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm min-h-[500px] p-6 space-y-10">

                    {/* 1. Draft Exams */}
                    {(draftOfflineExams.length > 0 || draftOnlineExams.length > 0) && (
                        <section>
                            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-4">
                                <span className="w-2 h-8 rounded-full bg-amber-400"></span>
                                Đang soạn thảo
                                <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">Bản nháp</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {draftOfflineExams.map((exam) => (
                                    <ExamCardOffline
                                        key={exam.examId}
                                        exam={exam}
                                        openMenu={openMenu}
                                        setOpenMenu={setOpenMenu}
                                        onDelete={confirmDelete}
                                        router={router}
                                    />
                                ))}
                                {draftOnlineExams.map((exam) => (
                                    <ExamCardOnline
                                        key={`draft-online-${exam.id}`}
                                        exam={exam}
                                        openMenu={openMenu}
                                        setOpenMenu={setOpenMenu}
                                        onDelete={confirmDelete}
                                        router={router}
                                        setOnlineExams={setOnlineExams}
                                        categories={categories}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 2. Published Exams */}
                    <section>
                        <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-4">
                            <span className="w-2 h-8 rounded-full bg-violet-600"></span>
                            Danh sách bài thi
                            <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">{readyExams.length}</span>
                        </h2>
                        {readyExams.length === 0 ? (
                            <EmptyState message="Chưa có bài thi nào được xuất bản" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {readyExams.map((exam) => (
                                    <ExamCardOffline
                                        key={exam.examId}
                                        exam={exam}
                                        openMenu={openMenu}
                                        setOpenMenu={setOpenMenu}
                                        onDelete={confirmDelete}
                                        onShare={(link) => { setShareLink(link); setOpenShare(true); }}
                                        router={router}
                                        isPublished
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 3. Online Exams */}
                    <section>
                        <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-4">
                            <span className="w-2 h-8 rounded-full bg-sky-500"></span>
                            Bài thi Online
                            <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">{activeOnlineExams.length}</span>
                        </h2>
                        {activeOnlineExams.length === 0 ? (
                            <EmptyState message="Chưa có bài thi online nào đang hoạt động" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {activeOnlineExams.map((exam) => (
                                    <ExamCardOnline
                                        key={exam.id}
                                        exam={exam}
                                        openMenu={openMenu}
                                        setOpenMenu={setOpenMenu}
                                        onDelete={confirmDelete}
                                        router={router}
                                        setOnlineExams={setOnlineExams}
                                        categories={categories}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 4. Finished Exams */}
                    {(finishedOfflineExams.length > 0 || finishedOnlineExams.length > 0) && (
                        <div className="border-t border-zinc-100 pt-8">
                            <h2 className="text-lg font-bold text-zinc-400 flex items-center gap-2 mb-4">
                                <ClockIcon className="w-5 h-5" /> Đã kết thúc
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60 hover:opacity-100 transition-opacity">
                                {finishedOfflineExams.map((exam) => (
                                    <ExamCardOffline key={`off-${exam.examId}`} exam={exam} openMenu={openMenu} setOpenMenu={setOpenMenu} onDelete={confirmDelete} router={router} isFinished />
                                ))}
                                {finishedOnlineExams.map((exam) => (
                                    <ExamCardOnline key={`on-${exam.id}`} exam={exam} openMenu={openMenu} setOpenMenu={setOpenMenu} onDelete={confirmDelete} router={router} isFinished setOnlineExams={setOnlineExams} categories={categories} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={performDelete}
                title={deletingItem?.title || ""}
            />

            {openShare && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-[480px] shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-zinc-900">Chia sẻ bài thi</h3>
                            <button onClick={() => setOpenShare(false)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex bg-zinc-100 p-1 rounded-xl mb-6">
                            <button onClick={() => setActiveTab("link")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'link' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
                                <LinkIcon className="w-4 h-4 inline-block mr-2" /> Link
                            </button>
                            <button onClick={() => setActiveTab("qr")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'qr' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
                                <QrCodeIcon className="w-4 h-4 inline-block mr-2" /> QR Code
                            </button>
                        </div>

                        {activeTab === "link" ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                                    <input value={shareLink} readOnly className="flex-1 bg-transparent text-sm text-zinc-600 outline-none" />
                                </div>
                                <button onClick={() => { navigator.clipboard.writeText(shareLink); toastSuccess("Đã sao chép!"); }} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-200">
                                    Sao chép liên kết
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-4">
                                <div className="w-48 h-48 bg-zinc-100 rounded-xl border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 mb-6">
                                    <QrCodeIcon className="w-16 h-16 opacity-20" />
                                </div>
                                <button className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-200">
                                    Tải xuống QR
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub Components ---

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50">
        <DocumentTextIcon className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-medium text-zinc-500">{message}</p>
    </div>
);

const ExamCardOffline = ({ exam, openMenu, setOpenMenu, onDelete, onShare, router, isPublished, isFinished }: any) => {
    return (
        <div className={`bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-all group relative flex flex-col justify-between h-full ${isPublished ? 'hover:border-violet-300' : 'hover:border-amber-300'}`}>
            <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                    <StatusBadge status={isFinished ? 'FINISHED' : (isPublished ? 'PUBLISHED' : 'DRAFT')} type="offline" />
                    <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === exam.examId ? null : exam.examId); }} className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors">
                        <EllipsisHorizontalIcon className="w-6 h-6" />
                    </button>
                    {/* Dropdown Menu */}
                    {openMenu === exam.examId && (
                        <div className="absolute right-4 top-12 bg-white shadow-xl ring-1 ring-black/5 rounded-xl py-2 w-48 z-20 animate-in fade-in zoom-in-95 origin-top-right">
                            <button onClick={() => router.push(`/admin/detail-exam/${exam.examId}`)} className="flex w-full items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"><EyeIcon className="w-4 h-4 mr-2" /> Chi tiết</button>
                            <button onClick={() => router.push(`/admin/update-exam/${exam.examId}`)} className="flex w-full items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"><PencilSquareIcon className="w-4 h-4 mr-2" /> Cập nhật</button>
                            {isPublished && onShare && (
                                <button onClick={() => { onShare(`${window.location.origin}/admin/exam/${exam.examId}`); setOpenMenu(null); }} className="flex w-full items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"><ShareIcon className="w-4 h-4 mr-2" /> Chia sẻ</button>
                            )}
                            <div className="w-full h-px bg-zinc-100 my-1"></div>
                            <button onClick={() => onDelete(exam.examId, 'offline', exam.title)} className="flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"><TrashIcon className="w-4 h-4 mr-2" /> Xóa</button>
                        </div>
                    )}
                </div>
                <h3 className="font-bold text-zinc-900 text-lg mb-1 line-clamp-2" title={exam.title}>{exam.title}</h3>
                {isPublished && <p className="text-xs text-zinc-500 font-medium mb-3 flex items-center gap-1"><GlobeAltIcon className="w-3 h-3" /> Công khai</p>}
            </div>

            <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <ClockIcon className="w-4 h-4 text-zinc-400" />
                    <span className="font-medium">{exam.durationMinutes} phút</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <TagIcon className="w-4 h-4 text-zinc-400" />
                    <span>{exam.category?.name || "Chưa phân loại"}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-zinc-600">
                    <CalendarIcon className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div className="flex flex-col">
                        <span>{new Date(exam.startTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {exam.endTime && (
                            <span>
                                Đến: {new Date(exam.endTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <DifficultyBadge level={exam.examLevel} />
                    <span className="text-xs font-semibold text-zinc-400 bg-zinc-100 px-2 py-1 rounded">{exam.questionCount} câu</span>
                </div>
            </div>

            {/* Action Button for Drafts */}
            {!isPublished && !isFinished && (
                <button onClick={() => router.push(`/admin/update-exam/${exam.examId}`)} className="w-full mt-4 py-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-sm hover:bg-amber-200 transition-colors">
                    Tiếp tục soạn
                </button>
            )}
        </div>
    );
}

const ExamCardOnline = ({ exam, openMenu, setOpenMenu, onDelete, router, setOnlineExams, isFinished, categories = [] }: any) => {
    return (
        <div className={`bg-white rounded-2xl border-2 p-5 shadow-sm hover:shadow-lg transition-all relative flex flex-col justify-between h-full ${exam.status === 'IN_PROGRESS' ? 'border-green-400 shadow-green-100' : (exam.status === 'WAITING' ? 'border-sky-400 shadow-sky-100' : 'border-zinc-100')}`}>
            <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                    <StatusBadge status={exam.status} type="online" />
                    <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === `online-${exam.id}` ? null : `online-${exam.id}`); }} className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors">
                        <EllipsisHorizontalIcon className="w-6 h-6" />
                    </button>
                    {openMenu === `online-${exam.id}` && (
                        <div className="absolute right-4 top-12 bg-white shadow-xl ring-1 ring-black/5 rounded-xl py-2 w-48 z-20 animate-in fade-in zoom-in-95">
                            <button onClick={() => router.push(`/admin/exam-online/update/${exam.id}`)} className="flex w-full items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"><PencilSquareIcon className="w-4 h-4 mr-2" /> Cập nhật</button>
                            <div className="w-full h-px bg-zinc-100 my-1"></div>
                            <button onClick={() => onDelete(exam.id, 'online', exam.name)} className="flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"><TrashIcon className="w-4 h-4 mr-2" /> Xóa</button>
                        </div>
                    )}
                </div>
                <h3 className="font-bold text-zinc-900 text-lg mb-1 line-clamp-2">{exam.name}</h3>
                <p className="text-xs text-zinc-500 font-mono bg-zinc-100 inline-block px-1.5 py-0.5 rounded">CODE: <span className="text-violet-600 font-bold">{exam.accessCode}</span></p>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <ClockIcon className="w-4 h-4 text-zinc-400" />
                    <span className="font-medium">{exam.durationMinutes} phút</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <TagIcon className="w-4 h-4 text-zinc-400" />
                    <span>{categories.find((c: any) => c.id === exam.categoryId)?.name || "Chưa phân loại"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <ComputerDesktopIcon className="w-4 h-4 text-zinc-400" />
                    <span>Online</span>
                </div>
            </div>

            {!isFinished && (
                <div className="mt-auto">
                    {exam.status === 'DRAFT' && (
                        <button onClick={() => router.push(`/admin/exam-online/update/${exam.id}`)} className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200">
                            Thêm câu hỏi
                        </button>
                    )}
                    {exam.status === 'WAITING' && (
                        <button onClick={() => router.push(`/admin/waiting-room/${exam.accessCode}`)} className="w-full py-2.5 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200">
                            Vào phòng chờ
                        </button>
                    )}
                    {exam.status === 'IN_PROGRESS' && (
                        <button onClick={() => router.push(`/admin/exam-online/${exam.id}/monitor`)} className="w-full py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2">
                            <PlayIcon className="w-4 h-4" /> Giám sát
                        </button>
                    )}
                </div>
            )}
            {isFinished && (
                <button onClick={() => router.push(`/admin/exam-online/${exam.id}/results`)} className="w-full mt-auto py-2.5 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-sm hover:bg-zinc-200 transition-colors">
                    Xem kết quả
                </button>
            )}
        </div>
    );
};
