"use client";

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import UserTable, { Column } from '@/components/admin/UserTable';
import {
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

class ApiError extends Error {
  status: number;
  payload: any;

  constructor(message: string, status: number, payload: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
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
    const errorPayload = isJson ? data : { message: data };
    const errorMessage = errorPayload.message || response.statusText;
    throw new ApiError(errorMessage, response.status, errorPayload);
  }
  return data;
}

interface Teacher {
  teacherId: number;
  username: string;
  email: string;
  createdAt: string;
  lastVisit: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'LOCKED';
}

async function fetchTeachersFromBackend(params: {
  username?: string;
  email?: string;
  page?: number;
  size?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params.email) queryParams.append('email', params.email);
  if (params.username) queryParams.append('username', params.username);

  const urlBase = '/api/admin/accounts/teachers';
  const url = queryParams.toString() ? `${urlBase}?${queryParams.toString()}` : urlBase;

  return await fetchApi(url);
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Chưa cập nhật';
  try {
    let date: Date;
    if (/^\d+$/.test(dateString)) date = new Date(parseInt(dateString));
    else date = new Date(dateString);

    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';

    return date.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  } catch {
    return 'Lỗi định dạng';
  }
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'PENDING': 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-500/20',
    'APPROVED': 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    'REJECTED': 'bg-rose-100 text-rose-700 border-rose-200 ring-rose-500/20',
    'LOCKED': 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    'PENDING': 'Chờ duyệt',
    'APPROVED': 'Hoạt động',
    'REJECTED': 'Bị từ chối',
    'LOCKED': 'Tạm khóa'
  };
  return map[status] || status;
}

const mapDisplayToApiStatus = (display: string) => {
  const mapReverse: Record<string, string> = {
    'Chờ duyệt': 'PENDING',
    'Hoạt động': 'APPROVED',
    'Bị từ chối': 'REJECTED',
    'Tạm khóa': 'LOCKED'
  };
  return mapReverse[display] || null;
};


export default function TeacherAccountsPage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [appliedEmail, setAppliedEmail] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');

  const [currentPage, setCurrentPage] = useState(0);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const itemsPerPage = 20;

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeachersFromBackend({
        username: appliedName || undefined,
        email: appliedEmail || undefined,
      });

      const content = Array.isArray((data as any)?.content)
        ? (data as any).content
        : Array.isArray(data) ? data : [];

      let filteredContent = content;
      if (appliedStatus !== 'all') {
        const apiStatus = mapDisplayToApiStatus(appliedStatus);
        if (apiStatus) {
          filteredContent = content.filter((t: Teacher) => t.status === apiStatus);
        }
      }

      // Client-side sort for now as API might not support it
      filteredContent.sort((a: Teacher, b: Teacher) => {
        const dateA = new Date(a.createdAt || a.lastVisit || 0).getTime();
        const dateB = new Date(b.createdAt || b.lastVisit || 0).getTime();
        return dateB - dateA;
      });

      setTeachers(filteredContent);
      setTotalPages((data as any).totalPages || 1);
      setTotalElements((data as any).totalElements || filteredContent.length);

    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách giáo viên');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [appliedEmail, appliedName, appliedStatus, currentPage]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleSearch = () => {
    setAppliedEmail(searchEmail);
    setAppliedName(searchName);
    setAppliedStatus(statusFilter);
    setCurrentPage(0);
  };

  const handleClearFilter = () => {
    setSearchEmail('');
    setSearchName('');
    setStatusFilter('all');
    setAppliedEmail('');
    setAppliedName('');
    setAppliedStatus('all');
    setCurrentPage(0);
  };

  const handleDelete = async (id: number) => {
    const teacher = teachers.find(t => t.teacherId === id);
    if (!teacher) return;

    const result = await Swal.fire({
      title: 'Xóa giáo viên?',
      text: `Hành động này không thể hoàn tác. Bạn có chắc muốn xóa "${teacher.username}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy bỏ',
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await fetchApi(`/api/admin/accounts/teachers/${id}`, { method: 'DELETE' });
        toast.success('Đã xóa giáo viên thành công!');
        fetchTeachers();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa giáo viên');
        setLoading(false); // only stop loading on error, success will re-fetch
      }
    }
  };

  const handleToggleLock = async (teacher: Teacher) => {
    if (teacher.status !== 'APPROVED' && teacher.status !== 'LOCKED') return;

    const isLocking = teacher.status === 'APPROVED';
    try {
      setLoading(true);
      if (isLocking) await fetchApi(`/api/admin/accounts/teachers/${teacher.teacherId}/lock`, { method: 'POST' });
      else await fetchApi(`/api/admin/accounts/teachers/${teacher.teacherId}/unlock`, { method: 'POST' });

      toast.success(isLocking ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi cập nhật trạng thái');
      setLoading(false);
    }
  };

  const columns: Column<Teacher>[] = [
    { header: 'STT', accessor: (_, idx) => (currentPage * itemsPerPage) + (idx || 0) + 1, className: 'w-16 text-center' },
    {
      header: 'Họ tên', accessor: (t) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
            {t.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-zinc-900">{t.username}</p>
            <p className="text-xs text-zinc-500">ID: {t.teacherId}</p>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: (t) => <span className="font-medium text-zinc-600">{t.email}</span> },
    { header: 'Ngày tạo', accessor: (t) => <span className="text-zinc-500 text-xs">{formatDate(t.createdAt)}</span> },
    { header: 'Truy cập cuối', accessor: (t) => <span className="text-zinc-500 text-xs">{formatDate(t.lastVisit)}</span> },
    {
      header: 'Trạng thái', accessor: (t) => (
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ring-1 ring-inset ${getStatusColor(t.status)}`}>
          {getStatusLabel(t.status)}
        </span>
      )
    },
    {
      header: 'Thao tác', className: 'text-right', accessor: (t) => (
        <div className="flex items-center justify-end gap-2">
          {(t.status === 'APPROVED' || t.status === 'LOCKED') && (
            <button
              onClick={() => handleToggleLock(t)}
              className={`p-2 rounded-lg transition-colors ${t.status === 'LOCKED'
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
              title={t.status === 'LOCKED' ? "Mở khóa" : "Khóa tài khoản"}
            >
              {t.status === 'LOCKED' ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => handleDelete(t.teacherId)}
            className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
            title="Xóa tài khoản"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <UserTable<Teacher>
      title="Quản lý Giáo viên"
      description="Danh sách và quản lý tài khoản giáo viên trong hệ thống."
      totalElements={totalElements}
      data={teachers}
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
      statusOptions={[
        { value: 'Chờ duyệt', label: 'Chờ duyệt' },
        { value: 'Hoạt động', label: 'Hoạt động' },
        { value: 'Bị từ chối', label: 'Bị từ chối' },
        { value: 'Tạm khóa', label: 'Tạm khóa' }
      ]}
      onSearch={handleSearch}
      onClearFilters={handleClearFilter}
    />
  );
}