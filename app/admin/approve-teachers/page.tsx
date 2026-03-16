"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import UserTable, { Column } from '@/components/admin/UserTable';
import {
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const INFO_ICON_SVG = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-violet-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);

interface PendingTeacher {
    id: number;
    fullName: string;
    email: string;
    status: string;
    experience: string;
    phone: string;
    requestDate: string;
    requestTimestamp: number;
    proofDocumentUrl: string | null;
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

    const response = await fetch(url, config);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        throw new Error(data.message || response.statusText || "Lỗi không xác định");
    }
    return data;
}

const TeacherDetailModal = ({ teacher, onClose }: { teacher: PendingTeacher; onClose: () => void }) => {
    if (!teacher) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start border-b border-zinc-100 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-zinc-800 flex items-center gap-2">
                        {INFO_ICON_SVG}
                        Chi tiết Yêu cầu
                    </h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-5 text-zinc-700">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-semibold text-xs text-zinc-400 uppercase tracking-wider mb-1">Họ tên</p>
                            <p className="text-lg font-bold text-zinc-900">{teacher.fullName}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-xs text-zinc-400 uppercase tracking-wider mb-1">Ngày đăng ký</p>
                            <p className="text-base font-medium">{teacher.requestDate}</p>
                        </div>
                    </div>

                    <div>
                        <p className="font-semibold text-xs text-zinc-400 uppercase tracking-wider mb-1">Email</p>
                        <p className="text-base font-medium bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100">{teacher.email}</p>
                    </div>

                    <div>
                        <p className="font-semibold text-xs text-zinc-400 uppercase tracking-wider mb-1">Trạng thái</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {teacher.status === 'pending' ? 'Chờ duyệt' : teacher.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-semibold text-xs text-zinc-400 uppercase tracking-wider mb-1">Kinh nghiệm</p>
                            <p className="text-base">{teacher.experience}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-xs text-zinc-400 uppercase tracking-wider mb-1">Điện thoại</p>
                            <p className="text-base">{teacher.phone}</p>
                        </div>
                    </div>

                    {teacher.proofDocumentUrl && (
                        <div>
                            <p className="font-semibold text-xs text-zinc-400 uppercase tracking-wider mb-1">Tài liệu đính kèm</p>
                            <a
                                href={teacher.proofDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-violet-600 hover:text-violet-700 hover:underline font-medium"
                            >
                                <EyeIcon className="w-4 h-4 mr-1.5" />
                                Xem tài liệu
                            </a>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function AdminReviewTeachersPage() {
    const [allTeachers, setAllTeachers] = useState<PendingTeacher[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<PendingTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState<PendingTeacher | null>(null);

    // Search states (managed locally for UserTable compatibility)
    const [searchEmail, setSearchEmail] = useState('');
    const [searchName, setSearchName] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // Although we only show pending effectively
    const [currentPage, setCurrentPage] = useState(0);

    const itemsPerPage = 20;

    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        try {
            // Using the existing endpoint structure but mapping to our type
            const data = await fetchApi(`/api/admin/teachers/pending`);
            const rawList = Array.isArray(data) ? data : (data.content || []);

            const mapped: PendingTeacher[] = rawList.map((t: any) => ({
                id: t.teacherId,
                fullName: t.username,
                email: t.email,
                status: t.status ? t.status.toLowerCase() : 'pending',
                experience: 'Chưa có thông tin', // API might not return this yet? Keeping placeholder from original code
                phone: 'Chưa có thông tin',
                proofDocumentUrl: null,
                requestDate: t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : 'N/A',
                requestTimestamp: t.createdAt ? new Date(t.createdAt).getTime() : 0,
            }));

            // Sort by newest
            mapped.sort((a, b) => b.requestTimestamp - a.requestTimestamp);

            setAllTeachers(mapped);
            setFilteredTeachers(mapped);
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi tải danh sách');
            setAllTeachers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    // Client-side filtering
    useEffect(() => {
        let result = allTeachers;

        if (searchEmail) {
            result = result.filter(t => t.email.toLowerCase().includes(searchEmail.toLowerCase()));
        }
        if (searchName) {
            result = result.filter(t => t.fullName.toLowerCase().includes(searchName.toLowerCase()));
        }
        // statusFilter is likely always 'all' or 'pending' for this page, but if user wants to filter...
        // Actually this page IS for pending, so maybe the status filter in UserTable is redundant? 
        // We can just keep it as 'all' or disable it visually? 
        // For UI consistency, we can leave it, but maybe only show 'pending' option.

        setFilteredTeachers(result);
        setCurrentPage(0); // Reset to page 0 on filter change
    }, [searchEmail, searchName, allTeachers]);

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        try {
            setLoading(true);
            await fetchApi(`/api/admin/teachers/${id}/${action}`, { method: 'POST' });

            toast.success(action === 'approve' ? 'Đã duyệt giáo viên!' : 'Đã từ chối yêu cầu!');

            // Remove from local list
            setAllTeachers(prev => prev.filter(t => t.id !== id));
            if (selectedTeacher?.id === id) setSelectedTeacher(null);

        } catch (error: any) {
            toast.error(error.message || 'Thao tác thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Pagination logic
    const paginatedData = useMemo(() => {
        const start = currentPage * itemsPerPage;
        return filteredTeachers.slice(start, start + itemsPerPage);
    }, [filteredTeachers, currentPage]);

    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

    const columns: Column<PendingTeacher>[] = [
        {
            header: 'STT',
            accessor: (_, idx) => (currentPage * itemsPerPage) + (idx || 0) + 1,
            className: 'w-16 text-center'
        },
        {
            header: 'Giáo viên',
            accessor: (t) => (
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setSelectedTeacher(t)}
                >
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm group-hover:bg-violet-200 transition-colors">
                        {t.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-zinc-900 group-hover:text-violet-700 transition-colors">{t.fullName}</p>
                        <p className="text-xs text-zinc-500">Nhấn để xem chi tiết</p>
                    </div>
                </div>
            )
        },
        { header: 'Email', accessor: (t) => <span className="font-medium text-zinc-600">{t.email}</span> },
        { header: 'Ngày ĐK', accessor: (t) => <span className="text-zinc-500 text-xs">{t.requestDate}</span> },
        {
            header: 'Trạng thái',
            accessor: (t) => (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold border ring-1 ring-inset bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20">
                    Chờ duyệt
                </span>
            )
        },
        {
            header: 'Thao tác',
            className: 'text-right',
            accessor: (t) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAction(t.id, 'reject'); }}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Từ chối"
                    >
                        <XCircleIcon className="w-4 h-4" /> Từ chối
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAction(t.id, 'approve'); }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Duyệt"
                    >
                        <CheckCircleIcon className="w-4 h-4" /> Duyệt
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <UserTable<PendingTeacher>
                title="Duyệt Giáo viên"
                description="Danh sách các yêu cầu đăng ký tài khoản giáo viên đang chờ phê duyệt."
                totalElements={filteredTeachers.length}
                data={paginatedData}
                columns={columns}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                searchEmail={searchEmail}
                setSearchEmail={setSearchEmail}
                searchName={searchName}
                setSearchName={setSearchName}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                statusOptions={[{ value: 'pending', label: 'Chờ duyệt' }]}
                onSearch={() => setCurrentPage(0)} // Triggers re-render basically
                onClearFilters={() => {
                    setSearchEmail('');
                    setSearchName('');
                    setStatusFilter('all');
                }}
                showStatusFilter={false}
                showClearFilter={false}
                emptyStateHead={searchEmail || searchName ? "Không tìm thấy kết quả" : "Không có yêu cầu nào"}
                emptyStateSub={searchEmail || searchName ? "Không có giáo viên nào phù hợp với tìm kiếm của bạn." : "Hiện tại không có giáo viên nào đang chờ duyệt."}
            />

            {selectedTeacher && (
                <TeacherDetailModal
                    teacher={selectedTeacher}
                    onClose={() => setSelectedTeacher(null)}
                />
            )}
        </>
    );
}
