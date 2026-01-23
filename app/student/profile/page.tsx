'use client';

import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchApi } from '@/lib/apiClient';
import { useUser } from '@/lib/user';
import {
  UserCircleIcon,
  CheckCircleIcon,
  TrophyIcon,
  FireIcon,
  EnvelopeIcon,
  CalendarIcon,
  CameraIcon,
  PencilIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, TrophyIcon as TrophySolid } from '@heroicons/react/24/solid';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

interface ExamHistory {
  id: number;
  examTitle: string;
  score: number;
  submittedAt: string;
  timeTaken?: number;
}

const StudentProfileContent = () => {
  const { user, mutate } = useUser();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  // Stats
  const [completedExams, setCompletedExams] = useState<number>(0);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [studyStreak, setStudyStreak] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<ExamHistory[]>([]);
  const [joinedDate, setJoinedDate] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await fetchApi('/profile');
        setUsername(data.name || data.username || '');
        setTempUsername(data.name || data.username || '');
        setEmail(data.email || '');
        setAvatar(data.avatar || null);
        setJoinedDate(data.createdAt || new Date().toISOString());
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!user || typeof (user as any).id === 'undefined') return;

    const loadStats = async () => {
      try {
        const histories = await fetchApi(`/examHistory/student/${(user as any).id}`);
        if (Array.isArray(histories) && histories.length > 0) {
          const examsDone = histories.length;
          const totalScore = histories.reduce((sum: number, h: any) => sum + (h.score || 0), 0);
          setCompletedExams(examsDone);
          setAverageScore(parseFloat((totalScore / examsDone).toFixed(1)));

          // Get recent 5 exams
          const recent = histories
            .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .slice(0, 5)
            .map((h: any) => ({
              id: h.id,
              examTitle: h.examTitle || 'Bài thi',
              score: h.score || 0,
              submittedAt: h.submittedAt,
              timeTaken: h.timeTaken
            }));
          setRecentActivity(recent);

          // Calculate study streak (simplified: consecutive days with exams)
          const uniqueDays = new Set(
            histories.map((h: any) => new Date(h.submittedAt).toDateString())
          );
          setStudyStreak(uniqueDays.size);
        } else {
          setCompletedExams(0);
          setAverageScore(0);
          setStudyStreak(0);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    loadStats();
  }, [user]);

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

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', avatarFile);

      const uploadData = await fetchApi('/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const finalAvatarUrl = uploadData.avatarUrl;

      await fetchApi('/profile/update', {
        method: 'PATCH',
        body: { username, avatar: finalAvatarUrl },
      });

      setAvatar(finalAvatarUrl);
      setAvatarFile(null);
      await mutate();
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Không thể cập nhật ảnh đại diện');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!tempUsername.trim()) {
      toast.error('Tên không được để trống');
      return;
    }

    setSaving(true);
    try {
      await fetchApi('/profile/update', {
        method: 'PATCH',
        body: { username: tempUsername.trim(), avatar },
      });

      setUsername(tempUsername.trim());
      setIsEditingUsername(false);
      await mutate();
      toast.success('Cập nhật tên thành công');
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error('Không thể cập nhật tên');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Không rõ';

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Không rõ';
      }

      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Không rõ';
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
      {/* Hero Section with Avatar and Stats */}
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

              {/* Avatar Actions */}
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

            {/* Name and Edit */}
            <div className="mt-6 space-y-2">
              {isEditingUsername ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="px-4 py-2 rounded-lg text-zinc-900 font-semibold text-xl focus:outline-none focus:ring-2 focus:ring-white/50"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={saving}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <CheckCircleSolid className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => {
                      setTempUsername(username);
                      setIsEditingUsername(false);
                    }}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-bold">{username}</h1>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
              <p className="text-violet-100 flex items-center gap-2 justify-center">
                <EnvelopeIcon className="w-4 h-4" />
                {email}
              </p>
            </div>

            {/* Action Buttons */}
            {(avatarFile || avatar) && (
              <div className="mt-4 flex gap-3">
                {avatarFile && (
                  <button
                    onClick={handleSaveAvatar}
                    disabled={saving}
                    className="px-6 py-2.5 bg-white text-violet-600 rounded-xl font-semibold hover:bg-violet-50 transition-all shadow-lg disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu ảnh mới'}
                  </button>
                )}
                {avatar && !avatarFile && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={saving}
                    className="px-6 py-2.5 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Cards (overlapping hero) */}
      <section className="relative z-20 -mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Exams Completed */}
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center">
                <CheckCircleSolid className="w-8 h-8 text-violet-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-violet-700">{completedExams}</div>
                <div className="text-sm text-zinc-600 font-medium">Bài thi hoàn thành</div>
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-fuchsia-100 rounded-xl flex items-center justify-center">
                <TrophySolid className="w-8 h-8 text-fuchsia-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-fuchsia-700">{averageScore.toFixed(1)}</div>
                <div className="text-sm text-zinc-600 font-medium">Điểm trung bình</div>
              </div>
            </div>
          </div>

          {/* Study Streak */}
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <FireIcon className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-700">{studyStreak}</div>
                <div className="text-sm text-zinc-600 font-medium">Ngày học tập</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info Cards */}
          <div className="space-y-6">
            {/* Personal Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-zinc-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <UserCircleIcon className="w-6 h-6 text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Thông tin cá nhân</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
                  <EnvelopeIcon className="w-5 h-5 text-zinc-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Email</div>
                    <div className="text-sm text-zinc-900 font-semibold">{email}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
                  <CalendarIcon className="w-5 h-5 text-zinc-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Ngày tham gia</div>
                    <div className="text-sm text-zinc-900 font-semibold">
                      {new Date(joinedDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
                  <SparklesIcon className="w-5 h-5 text-zinc-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Vai trò</div>
                    <div className="inline-flex px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                      Học viên
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-zinc-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Thành tích</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Tổng số bài thi</span>
                  <span className="text-lg font-bold text-zinc-900">{completedExams}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div className="bg-violet-600 h-2 rounded-full" style={{ width: `${Math.min((completedExams / 50) * 100, 100)}%` }}></div>
                </div>
                <div className="text-xs text-zinc-500 text-center">
                  {completedExams < 50 ? `Còn ${50 - completedExams} bài để đạt mốc 50 bài` : 'Đã hoàn thành mốc 50 bài! 🎉'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-zinc-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-fuchsia-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-fuchsia-600" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Hoạt động gần đây</h2>
              </div>

              {recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <ChartBarIcon className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">Chưa có hoạt động</h3>
                  <p className="text-zinc-500">Hãy bắt đầu làm bài thi để theo dõi tiến trình của bạn!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors"
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${getScoreColor(activity.score).includes('emerald') ? 'bg-emerald-500' : getScoreColor(activity.score).includes('yellow') ? 'bg-yellow-500' : 'bg-rose-500'}`}></div>
                        {index < recentActivity.length - 1 && (
                          <div className="w-0.5 h-12 bg-zinc-200 my-1"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900 mb-1">{activity.examTitle}</h3>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {formatDate(activity.submittedAt)}
                          </span>
                          {activity.timeTaken && (
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {activity.timeTaken} phút
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className={`px-4 py-2 rounded-lg border ${getScoreColor(activity.score)} font-bold text-lg`}>
                        {activity.score.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentProfileContent;
