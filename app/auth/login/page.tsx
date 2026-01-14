'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toastSuccess, toastError } from '@/lib/toast';
import { fetchApi, ApiError } from '@/lib/apiClient';
import { useUser } from '@/lib/user';
import AccountLockedPopup from '@/components/AccountLockedPopup';
import AccountPendingPopup from '@/components/AccountPendingPopup';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const { mutate } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLockedPopup, setShowLockedPopup] = useState(false);
  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [accountType, setAccountType] = useState<'teacher' | 'student'>('student');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setLoading(true);

    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response.token) {
        localStorage.setItem('jwt', response.token);
        await mutate();
        toastSuccess('Đăng nhập thành công!');

        const user = await fetchApi('/me');
        const rawRole = user?.authorities?.[0]?.authority || '';
        const cleanRole = rawRole.replace('ROLE_', '').toUpperCase();

        if (cleanRole === 'STUDENT') router.push('/student/studenthome');
        else if (cleanRole === 'TEACHER') router.push('/teacher/teacherhome');
        else if (cleanRole === 'ADMIN') router.push('/admin');
        else router.push('/');
      } else {
        throw new Error('Phản hồi đăng nhập không chứa Token.');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      let errorMessage = 'Sai tài khoản hoặc mật khẩu.';

      if (err instanceof ApiError) errorMessage = err.message;
      else if (err.error) errorMessage = err.error;
      else if (err.message) errorMessage = err.message;

      setError(errorMessage);

      if (errorMessage.includes('chờ phê duyệt') || errorMessage.includes('bị từ chối')) {
        setShowPendingPopup(true);
      } else if (errorMessage.includes('khóa') || err.status === 403) {
        const accType = email.includes('teacher') || email.includes('gv') ? 'teacher' : 'student';
        setAccountType(accType);
        setShowLockedPopup(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-violet-50 to-fuchsia-50">

      {/* Left Decoration Section */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-violet-600 p-12 text-white flex-col justify-between">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/30 blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-fuchsia-500/30 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">QuizzZone</h1>
          <p className="text-violet-100 text-lg max-w-md">
            Nền tảng thi trắc nghiệm trực tuyến hàng đầu. Nâng cao kiến thức, chinh phục thử thách.
          </p>
        </div>

        <div className="relative z-10">
          <img
            src="/roles/home.jpg"
            alt="Login Illustration"
            className="w-full h-auto max-w-lg rounded-2xl shadow-2xl shadow-violet-900/20 border border-white/10"
          />
        </div>

        <div className="relative z-10 text-sm text-violet-200">
          &copy; {new Date().getFullYear()} QuizzZone Inc. All rights reserved.
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-zinc-200/50 border border-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Chào mừng trở lại! 👋</h2>
            <p className="text-zinc-500">
              Vui lòng đăng nhập để tiếp tục truy cập.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <EnvelopeIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-zinc-700">Mật khẩu</label>
                <Link href="/forgot-password" className="text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Bạn chưa có tài khoản?{' '}
              <Link href="/register" className="font-semibold text-violet-600 hover:text-violet-700 hover:underline transition-all">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Account Locked Popup */}
      <AccountLockedPopup
        isOpen={showLockedPopup}
        onClose={() => setShowLockedPopup(false)}
        accountType={accountType}
      />

      {/* Account Pending Approval Popup */}
      <AccountPendingPopup
        isOpen={showPendingPopup}
        onClose={() => setShowPendingPopup(false)}
      />
    </div>
  );
}