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

interface Student {
  studentId: number;
  username: string;
  email: string;
  createdAt: string;
  lastVisit: string | null;
  status: 'ACTIVE' | 'LOCKED';
}

async function fetchStudentsFromBackend(params: {
  email?: string;
  username?: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params.email) queryParams.append('email', params.email);
  if (params.username) queryParams.append('username', params.username);
  if (params.status && params.status !== 'all') queryParams.append('status', params.status);

  queryParams.append('page', String(params.page || 0));
  queryParams.append('size', String(params.size || 20));
  queryParams.append('sort', 'createdAt,desc');

  const url = `/api/admin/accounts/students?${queryParams.toString()}`;
  return await fetchApi(url);
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Chưa có';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return 'Lỗi định dạng';
  }
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'ACTIVE': 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    'LOCKED': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    'ACTIVE': 'Hoạt động',
    'LOCKED': 'Tạm khóa'
  };
  return map[status] || status;
}

const getApiStatus = (displayStatus: string) => {
  switch (displayStatus) {
    case 'Hoạt động': return 'ACTIVE';
    case 'Tạm khóa': return 'LOCKED';
    default: return 'all';
  }
}


export default function StudentAccountsPage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [appliedEmail, setAppliedEmail] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');

  const [currentPage, setCurrentPage] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const itemsPerPage = 20;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStudentsFromBackend({
        email: appliedEmail || undefined,
        username: appliedName || undefined,
        status: appliedStatus !== 'all' ? appliedStatus : undefined,
        page: currentPage,
        size: itemsPerPage,
      });

      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];

      // Sort by newest first
      content.sort((a: Student, b: Student) => {
        const dateA = new Date(a.createdAt || a.lastVisit || 0).getTime();
        const dateB = new Date(b.createdAt || b.lastVisit || 0).getTime();
        return dateB - dateA;
      });

      setStudents(content);
      if (typeof data.totalPages === "number") setTotalPages(data.totalPages || 1);
      if (typeof data.totalElements === "number") setTotalElements(data.totalElements || content.length);
      else if (content.length > 0 && totalElements === 0) {
        setTotalPages(1);
        setTotalElements(content.length);
      }

    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách học sinh');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [appliedEmail, appliedName, appliedStatus, currentPage, totalElements]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = () => {
    setAppliedEmail(searchEmail);
    setAppliedName(searchName);
    setAppliedStatus(getApiStatus(statusFilter));
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
    const student = students.find((s: Student) => s.studentId === id);
    if (!student) return;

    const result = await Swal.fire({
      title: 'Xóa học sinh?',
      text: `Hành động này không thể hoàn tác. Bạn có chắc muốn xóa "${student.username}"?`,
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
        await fetchApi(`/api/admin/accounts/students/${id}`, { method: 'DELETE' });
        toast.success('Đã xóa học sinh thành công!');
        // Reset current page if last item on page deleted
        if (students.length === 1 && currentPage > 0) {
          setCurrentPage(p => p - 1);
        } else {
          fetchStudents();
        }
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa học sinh');
        setLoading(false);
      }
    }
  };

  const handleToggleLock = async (student: Student) => {
    if (student.status !== 'ACTIVE' && student.status !== 'LOCKED') return;

    const isLocking = student.status === 'ACTIVE';
    try {
      setLoading(true);
      if (isLocking) await fetchApi(`/api/admin/accounts/students/${student.studentId}/lock`, { method: 'POST' });
      else await fetchApi(`/api/admin/accounts/students/${student.studentId}/unlock`, { method: 'POST' });

      toast.success(isLocking ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi cập nhật trạng thái');
      setLoading(false);
    }
  };

  const columns: Column<Student>[] = [
    { header: 'STT', accessor: (_, idx) => (currentPage * itemsPerPage) + (idx || 0) + 1, className: 'w-16 text-center' },
    {
      header: 'Họ tên', accessor: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
            {s.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-zinc-900">{s.username}</p>
            <p className="text-xs text-zinc-500">ID: {s.studentId}</p>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: (s) => <span className="font-medium text-zinc-600">{s.email}</span> },
    { header: 'Ngày tạo', accessor: (s) => <span className="text-zinc-500 text-xs">{formatDate(s.createdAt)}</span> },
    { header: 'Truy cập cuối', accessor: (s) => <span className="text-zinc-500 text-xs">{formatDate(s.lastVisit)}</span> },
    {
      header: 'Trạng thái', accessor: (s) => (
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ring-1 ring-inset ${getStatusColor(s.status)}`}>
          {getStatusLabel(s.status)}
        </span>
      )
    },
    {
      header: 'Thao tác', className: 'text-right', accessor: (s) => (
        <div className="flex items-center justify-end gap-2">
          {(s.status === 'ACTIVE' || s.status === 'LOCKED') && (
            <button
              onClick={() => handleToggleLock(s)}
              className={`p-2 rounded-lg transition-colors ${s.status === 'LOCKED'
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
              title={s.status === 'LOCKED' ? "Mở khóa" : "Khóa tài khoản"}
            >
              {s.status === 'LOCKED' ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => handleDelete(s.studentId)}
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
    <UserTable<Student>
      title="Quản lý Học sinh"
      description="Danh sách và quản lý tài khoản học sinh trong hệ thống."
      totalElements={totalElements}
      data={students}
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
        { value: 'Hoạt động', label: 'Hoạt động' },
        { value: 'Tạm khóa', label: 'Tạm khóa' }
      ]}
      onSearch={handleSearch}
      onClearFilters={handleClearFilter}
    />
  );
}