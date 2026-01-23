'use client';

import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchApi } from '@/lib/apiClient';
import { useUser } from '@/lib/user';
import {
  UserCircleIcon,
  CameraIcon,
  EnvelopeIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  CpuChipIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const AdminProfilePage = () => {
  const { user, mutate } = useUser();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats purely for visual dashboard feel (Admin doesn't have specific stats yet)
  const stats = [
    { label: 'Vai trò', value: 'Administrator', icon: ShieldCheckIcon, color: 'text-violet-600', bg: 'bg-violet-100' },
    { label: 'Trạng thái', value: 'Hoạt động', icon: ServerStackIcon, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Quyền hạn', value: 'Toàn hệ thống', icon: GlobeAltIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await fetchApi('/profile');
        setUsername(data.name || data.username || '');
        setEmail(data.email || '');
        setAvatar(data.avatar || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      if (e.target) e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Ảnh đại diện không được lớn hơn 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleChooseAvatar = () => {
    fileRef.current?.click();
  };

  const handleDeleteAvatar = async () => {
    if (!avatar) {
      toast.error('Không có ảnh đại diện để xóa');
      return;
    }

    setSaving(true);
    try {
      await fetchApi('/profile/delete-avatar', { method: 'DELETE' });
      setAvatar(null);
      setAvatarFile(null);
      await mutate();
      toast.success('Đã xóa ảnh đại diện');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Không thể xóa ảnh đại diện');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Tên không được để trống');
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatar;

      // Upload new avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const uploadData = await fetchApi('/profile/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        finalAvatarUrl = uploadData.avatarUrl;
      }

      // Update profile info
      await fetchApi('/profile/update', {
        method: 'PATCH',
        body: { username: username.trim(), avatar: finalAvatarUrl },
      });

      setAvatar(finalAvatarUrl);
      setAvatarFile(null);
      await mutate();
      toast.success('Cập nhật hồ sơ thành công');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-12 w-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 pb-32">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-black/10 blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="flex flex-col items-center text-center text-white">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white/20">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-violet-100">
                    <UserCircleIcon className="w-24 h-24 text-violet-400" />
                  </div>
                )}
              </div>

              <button
                onClick={handleChooseAvatar}
                className="absolute bottom-2 right-2 p-3 bg-white text-violet-600 rounded-full shadow-lg hover:bg-violet-50 transition-all transform hover:scale-110"
                disabled={saving}
              >
                <CameraIcon className="w-5 h-5" />
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Name/Email Display */}
            <div className="mt-6 space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold">{username}</h1>
              <p className="text-violet-100 flex items-center gap-2 justify-center">
                <EnvelopeIcon className="w-4 h-4" />
                {email}
              </p>
            </div>

            {/* Action Buttons for Avatar */}
            {(avatarFile || (avatar && !avatarFile)) && (
              <div className="mt-6 flex gap-3">
                {avatarFile && (
                  <button onClick={handleSave} className="bg-white text-violet-600 px-4 py-2 rounded-full font-bold shadow-lg">Lưu ảnh mới</button>
                )}
                {avatar && !avatarFile && (
                  <button onClick={handleDeleteAvatar} className="bg-white/20 text-white px-4 py-2 rounded-full font-bold border border-white/50 hover:bg-white/30">Xóa ảnh</button>
                )}
              </div>
            )}


          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="relative z-20 -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div>
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-zinc-600 font-medium">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pb-20">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-zinc-100">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-100">
            <div className="p-2 bg-violet-100 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">Cập nhật thông tin</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Tên hiển thị
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400"
                  placeholder="Nhập tên hiển thị của bạn"
                  required
                />
              </div>
            </div>

            {/* Email Input (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="block w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <LockClosedIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500">Email không thể thay đổi vì lý do bảo mật.</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span>Lưu thay đổi</span>
                    <CheckCircleSolid className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

// Helper icon component since LockClosedIcon wasn't imported in the list above but used in the form
const LockClosedIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

export default AdminProfilePage;