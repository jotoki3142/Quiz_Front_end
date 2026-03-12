"use client";

import React from "react";
import {
    MagnifyingGlassIcon,
    TrashIcon,
    LockClosedIcon,
    LockOpenIcon,
    FunnelIcon,
    ChevronDownIcon
} from "@heroicons/react/24/outline";

export interface Column<T> {
    header: string;
    accessor: (item: T, index: number) => React.ReactNode;
    className?: string;
}

export interface UserTableProps<T> {
    title: string;
    description: string;
    totalElements: number;
    data: T[];
    columns: Column<T>[];
    loading: boolean;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    // Filters
    searchEmail: string;
    setSearchEmail: (val: string) => void;
    searchName: string;
    setSearchName: (val: string) => void;
    statusFilter: string;
    setStatusFilter: (val: string) => void;
    statusOptions: { value: string; label: string }[];
    onSearch: () => void;
    onClearFilters: () => void;
    showStatusFilter?: boolean;
    showClearFilter?: boolean;
}

export default function UserTable<T>({
    title,
    description,
    totalElements,
    data,
    columns,
    loading,
    currentPage,
    totalPages,
    onPageChange,
    searchEmail,
    setSearchEmail,
    searchName,
    setSearchName,
    statusFilter,
    setStatusFilter,
    statusOptions,
    onSearch,
    onClearFilters,
    showStatusFilter = true,
    showClearFilter = true,
}: UserTableProps<T>) {

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. Hero / Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-xl shadow-violet-200">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black/10 blur-3xl"></div>

                <div className="relative p-8 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black tracking-tight">{title}</h1>
                            <p className="text-violet-100 max-w-xl text-sm md:text-base leading-relaxed">
                                {description}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 rounded-2xl bg-white text-violet-700 text-sm font-bold shadow-lg shadow-black/5">
                                {loading ? "..." : totalElements} <span className="text-zinc-500 font-medium ml-1">tài khoản</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Search / Filter Bar (Embedded in Hero) */}
                    <div className="mt-8 p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-zinc-400 font-semibold group-focus-within:text-violet-600 transition-colors">@</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tìm theo Email..."
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all text-sm shadow-sm"
                                />
                            </div>

                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tìm theo Tên..."
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all text-sm shadow-sm"
                                />
                            </div>

                            {showStatusFilter && (
                                <div className="relative md:w-48 group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FunnelIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full pl-10 pr-8 py-3 rounded-xl bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 text-zinc-900 focus:outline-none appearance-none cursor-pointer transition-all text-sm shadow-sm"
                                    >
                                        <option className="text-gray-900" value="all">Tất cả trạng thái</option>
                                        {statusOptions.map((opt) => (
                                            <option key={opt.value} className="text-gray-900" value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                {showClearFilter && (
                                    <button
                                        onClick={onClearFilters}
                                        className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                                    >
                                        Xóa lọc
                                    </button>
                                )}
                                <button
                                    onClick={onSearch}
                                    className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white text-violet-600 hover:bg-violet-50 text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                >
                                    Tìm kiếm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Data Table */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-600">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={`px-6 py-4 font-semibold text-zinc-900 uppercase tracking-wider text-xs ${col.className || ''}`}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                // Loading skeleton
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {columns.map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-zinc-100 rounded w-24"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-zinc-400">
                                            <MagnifyingGlassIcon className="w-12 h-12 mb-3 bg-zinc-50 p-2 rounded-full" />
                                            <p className="text-lg font-medium text-zinc-900">Không tìm thấy dữ liệu</p>
                                            <p className="text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm lại.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-violet-50/30 transition-colors group">
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={`px-6 py-4 align-middle ${col.className || ''}`}>
                                                {col.accessor(item, rowIdx)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 4. Pagination */}
                {!loading && data.length > 0 && (
                    <div className="px-6 py-5 border-t border-zinc-100 bg-zinc-50/50 flex flex-col md:grid md:grid-cols-3 items-center gap-4">
                        {/* 1. Summary Text (Left) */}
                        <div className="w-full md:text-left text-center order-2 md:order-1">
                            <p className="text-sm text-zinc-500">
                                Hiển thị <span className="font-medium text-zinc-900">{currentPage * 20 + 1}</span> đến{' '}
                                <span className="font-medium text-zinc-900">
                                    {Math.min((currentPage + 1) * 20, totalElements)}
                                </span>{' '}
                                trong tổng số <span className="font-medium text-zinc-900">{totalElements}</span> kết quả
                            </p>
                        </div>

                        {/* 2. Pagination Buttons (Center) */}
                        <div className="flex items-center justify-center gap-1 order-1 md:order-2 w-full">
                            <button
                                onClick={() => onPageChange(0)}
                                disabled={currentPage === 0}
                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent transition-all"
                            >
                                <span className="sr-only">First</span>
                                «
                            </button>
                            <button
                                onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent transition-all"
                            >
                                <span className="sr-only">Previous</span>
                                ‹
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let p = i;
                                    if (totalPages > 5) {
                                        if (currentPage > 2) p = currentPage - 2 + i;
                                        if (p >= totalPages) p = totalPages - (5 - i);
                                    }
                                    if (p < 0) p = 0;

                                    return (
                                        <button
                                            key={p}
                                            onClick={() => onPageChange(p)}
                                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${currentPage === p
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
                                onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:bg-transparent transition-all"
                            >
                                <span className="sr-only">Next</span>
                                ›
                            </button>
                            <button
                                onClick={() => onPageChange(totalPages - 1)}
                                disabled={currentPage === totalPages - 1}
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
    );
}
