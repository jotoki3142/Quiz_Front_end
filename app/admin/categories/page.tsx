"use client";

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    FolderIcon,
    BookOpenIcon,
    UserIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

interface Category {
    id: number;
    name: string;
    description: string;
    questionCount?: number;
    createdBy?: string;
    createdByName?: string;
    createdByRole?: string;
}

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

    // Ensure /api prefix if not present
    const fullUrl = url.startsWith('/api') ? url : (url.startsWith('/') ? `/api${url}` : `/api/${url}`);

    const response = await fetch(fullUrl, config);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        throw new Error(data.message || response.statusText || "Lỗi không xác định");
    }
    return data;
}

const CategoryModal = ({
    isOpen,
    onClose,
    onSave,
    editingCategory,
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; description: string }) => Promise<void>;
    editingCategory: Category | null;
    loading: boolean;
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (editingCategory) {
                setName(editingCategory.name);
                setDescription(editingCategory.description || "");
            } else {
                setName("");
                setDescription("");
            }
        }
    }, [isOpen, editingCategory]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({ name, description });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        {editingCategory ? <PencilSquareIcon className="w-6 h-6 text-violet-600" /> : <PlusIcon className="w-6 h-6 text-violet-600" />}
                        {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
                    </h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                            Tên danh mục <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                            placeholder="Ví dụ: Toán học, Vật lý..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                            Mô tả
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium resize-none"
                            placeholder="Mô tả ngắn gọn về danh mục này..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-200 disabled:opacity-70 disabled:pointer-events-none"
                            disabled={loading || !name.trim()}
                        >
                            {loading ? "Đang lưu..." : (editingCategory ? "Cập nhật" : "Tạo mới")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    categoryName,
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    categoryName: string;
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
                    Bạn có chắc chắn muốn xóa danh mục <span className="font-bold text-zinc-900">"{categoryName}"</span>?
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

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const PAGE_SIZE = 10;

    const fetchCategories = useCallback(async (p = page, k = keyword) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(p),
                size: String(PAGE_SIZE),
                sort: "id,desc",
            });
            if (k.trim()) params.append("name", k.trim());

            const data = await fetchApi(`/categories/search?${params.toString()}`);
            const content = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);

            setCategories(content);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || content.length);
        } catch (error: any) {
            toast.error(error.message || "Không thể tải danh mục");
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, [page, keyword]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSearch = () => {
        setPage(0); // Reset to page 0
        fetchCategories(0, keyword);
    };

    const handleSave = async (data: { name: string; description: string }) => {
        setLoading(true);
        try {
            if (editingCategory) {
                // Update
                const body = { id: editingCategory.id, ...data };
                await fetchApi(`/categories/edit/${editingCategory.id}`, { method: 'PATCH', body });
                toast.success("Cập nhật danh mục thành công");
            } else {
                // Create
                await fetchApi(`/categories/create`, { method: 'POST', body: data });
                toast.success("Tạo danh mục thành công");
                setPage(0); // Return to first page to see new item
                await fetchCategories(0, keyword); // Reload
            }
            setIsModalOpen(false);
            if (editingCategory) fetchCategories(); // Reload if editing to reflect changes
        } catch (error: any) {
            toast.error(error.message || "Lưu thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingCategory) return;
        setLoading(true);
        try {
            await fetchApi(`/categories/delete/${deletingCategory.id}`, { method: 'DELETE' });
            toast.success("Đã xóa danh mục");
            setIsDeleteModalOpen(false);
            setDeletingCategory(null);
            fetchCategories(); // Reload list
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
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                    <FolderIcon className="w-10 h-10 text-violet-200" />
                                    Quản lý Danh mục
                                </h1>
                                <p className="text-violet-100 max-w-xl text-lg opacity-90">
                                    Quản lý các danh mục môn học và chủ đề cho ngân hàng câu hỏi.
                                </p>
                            </div>
                            <div className="px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 font-bold shadow-lg">
                                {totalElements} <span className="text-violet-100 font-medium ml-1">danh mục</span>
                            </div>
                        </div>

                        {/* Search Bar Embedded */}
                        <div className="mt-8 p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    // onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Tìm kiếm danh mục..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all text-sm font-medium shadow-sm"
                                />
                            </div>
                            <button
                                onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
                                className="px-6 py-3 rounded-xl bg-white text-violet-700 font-bold shadow-lg hover:bg-violet-50 transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="w-5 h-5" /> Thêm mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-600">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs">STT</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs">Tên danh mục</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs w-1/3">Mô tả</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs text-center">Câu hỏi</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs">Người tạo</th>
                                    <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider text-xs text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {categories.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-zinc-400">
                                                <FolderIcon className="w-16 h-16 mb-4 stroke-1 opacity-20" />
                                                <p className="text-lg font-semibold text-zinc-600">Chưa có danh mục nào</p>
                                                <p className="text-sm">Hãy tạo danh mục mới để bắt đầu.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((cat, idx) => (
                                        <tr key={cat.id} className="group hover:bg-violet-50/40 transition-colors">
                                            <td className="px-6 py-4 font-medium text-zinc-400">{page * PAGE_SIZE + idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-zinc-800 text-base group-hover:text-violet-700 transition-colors">{cat.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 leading-relaxed line-clamp-2 max-w-xs">{cat.description || "—"}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 font-bold text-xs border border-zinc-200">
                                                    <BookOpenIcon className="w-3.5 h-3.5 mr-1" />
                                                    {cat.questionCount || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="w-4 h-4 text-zinc-400" />
                                                    <span className="font-medium text-zinc-700">{cat.createdByName || cat.createdBy || "Admin"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                                                        className="p-2 rounded-lg text-violet-600 hover:bg-violet-100 transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <PencilSquareIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeletingCategory(cat); setIsDeleteModalOpen(true); }}
                                                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors"
                                                        title="Xóa"
                                                    >
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
                    {!loading && categories.length > 0 && (
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

            {/* Modals */}
            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingCategory={editingCategory}
                loading={loading}
            />
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                categoryName={deletingCategory?.name || ""}
                loading={loading}
            />
        </div>
    );
}
