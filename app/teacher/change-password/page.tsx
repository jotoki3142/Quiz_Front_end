'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { fetchApi } from '@/lib/apiClient';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

interface PasswordRequirements {
  minLength: boolean;
  hasNumber: boolean;
  hasUpper: boolean;
  hasLower: boolean;
}

const TeacherChangePasswordPage = () => {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');

  // Calculate password strength
  const passwordStrength = useMemo((): PasswordStrength => {
    let score = 0;
    if (newPassword.length >= 6) score += 25;
    if (newPassword.length >= 8) score += 15;
    if (/[0-9]/.test(newPassword)) score += 20;
    if (/[a-z]/.test(newPassword)) score += 20;
    if (/[A-Z]/.test(newPassword)) score += 20;

    if (score < 40) {
      return {
        score,
        label: 'Yếu',
        color: 'bg-rose-500',
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-700'
      };
    }
    if (score < 80) {
      return {
        score,
        label: 'Trung bình',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700'
      };
    }
    return {
      score,
      label: 'Mạnh',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-700'
    };
  }, [newPassword]);

  // Validate password requirements
  const requirements = useMemo((): PasswordRequirements => ({
    minLength: newPassword.length >= 6,
    hasNumber: /[0-9]/.test(newPassword),
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
  }), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      await fetchApi('/change-password', {
        method: 'POST',
        body: {
          currentPassword,
          newPassword,
        },
      });

      setShowSuccessModal(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push('/teacher/profile');
      }, 3000);
    } catch (err: any) {
      const message = err.message || 'Đã xảy ra lỗi khi đổi mật khẩu';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-2xl mb-4">
            <LockClosedIcon className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Đổi mật khẩu</h1>
          <p className="text-zinc-600">Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-start gap-3">
                    <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <LockClosedIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400"
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <LockClosedIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400"
                      placeholder="Nhập mật khẩu mới"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600">Độ mạnh mật khẩu</span>
                        <span className={`font-semibold ${passwordStrength.textColor}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${passwordStrength.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <LockClosedIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400"
                      placeholder="Nhập lại mật khẩu mới"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <span>Đổi mật khẩu</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column - Security Info */}
            <div className="space-y-6">
              {/* Requirements Checklist */}
              <div className="bg-violet-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-violet-600" />
                  Gợi ý mật khẩu mạnh
                </h3>
                <ul className="space-y-3">
                  {[
                    { met: requirements.minLength, text: 'Ít nhất 6 ký tự' },
                    { met: requirements.hasNumber, text: 'Chứa số' },
                    { met: requirements.hasUpper, text: 'Chữ hoa' },
                    { met: requirements.hasLower, text: 'Chữ thường' },
                  ].map((req, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      {req.met ? (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-zinc-300 flex-shrink-0" />
                      )}
                      <span className={req.met ? 'text-emerald-700 font-medium' : 'text-zinc-600'} >
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security Tips */}
              <div className="bg-fuchsia-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-zinc-900 mb-3">💡 Mẹo bảo mật</h3>
                <ul className="space-y-2 text-xs text-zinc-600">
                  <li>• Không sử dụng thông tin cá nhân</li>
                  <li>• Kết hợp chữ, số và ký tự đặc biệt</li>
                  <li>• Không dùng lại mật khẩu cũ</li>
                  <li>• Thay đổi định kỳ mỗi 3 tháng</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">Thành công! 🎉</h3>
            <p className="text-zinc-600 mb-6">
              Mật khẩu của bạn đã được cập nhật thành công.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/teacher/profile')}
                className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
              >
                Về trang Profile
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-zinc-100 text-zinc-700 py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
              >
                Đóng
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              Tự động chuyển hướng sau 3 giây...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherChangePasswordPage;
