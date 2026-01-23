'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import OtpInput from '@/components/OtpInput';
import {
  EnvelopeIcon,
  KeyIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

type ForgotPasswordStep = 'email' | 'otp' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const startResendCountdown = () => {
    let countdown = 60;
    setResendCountdown(countdown);
    const interval = setInterval(() => {
      countdown--;
      setResendCountdown(countdown);
      if (countdown <= 0) clearInterval(interval);
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        throw new Error('Phản hồi từ máy chủ không đúng định dạng. Vui lòng thử lại sau.');
      }

      if (!res.ok) {
        throw new Error(responseData.error || 'Gửi yêu cầu thất bại');
      }

      toast.success('Mã OTP đã được gửi đến email của bạn');
      setStep('otp');
      startResendCountdown();
    } catch (err: any) {
      let errorMessage;
      if (err.message === 'User with this email not found') {
        errorMessage = 'Email không tồn tại.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra lại đường truyền mạng.';
        toast.error(errorMessage);
      } else {
        errorMessage = 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: otp }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Xác nhận OTP thất bại');
      }

      toast.success('OTP hợp lệ, vui lòng đặt mật khẩu mới');
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Xác nhận OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Gửi lại mã OTP thất bại');
      }

      toast.success('Mã OTP mới đã được gửi');
      startResendCountdown();
    } catch (err: any) {
      setError(err.message || 'Gửi lại mã OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu không trùng khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: otp,
          newPassword,
          confirmPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Đặt lại mật khẩu thất bại');
      }

      toast.success('Thay đổi mật khẩu thành công');
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const getStepNumber = () => {
    if (step === 'email') return 1;
    if (step === 'otp') return 2;
    return 3;
  };

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
            Đừng lo lắng! Chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào tài khoản của mình.
          </p>
        </div>

        <div className="relative z-10">
          <img
            src="/roles/home.jpg"
            alt="Password Reset Illustration"
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
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Quên mật khẩu? 🔑</h2>
            <p className="text-zinc-500">
              {step === 'email' && 'Nhập email để nhận mã xác thực'}
              {step === 'otp' && 'Nhập mã OTP đã được gửi đến email'}
              {step === 'reset' && 'Tạo mật khẩu mới cho tài khoản của bạn'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${num < getStepNumber()
                      ? 'bg-green-500 text-white'
                      : num === getStepNumber()
                        ? 'bg-violet-600 text-white ring-4 ring-violet-200'
                        : 'bg-zinc-200 text-zinc-400'
                    }`}
                >
                  {num < getStepNumber() ? <CheckCircleIcon className="w-6 h-6" /> : num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-8 h-1 rounded ${num < getStepNumber() ? 'bg-green-500' : 'bg-zinc-200'
                      }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <EnvelopeIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi mã OTP</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center text-sm">
                <Link href="/auth/login" className="flex items-center justify-center gap-1 text-violet-600 hover:text-violet-700 font-medium hover:underline transition-all">
                  <ArrowLeftIcon className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center">
                    <KeyIcon className="w-7 h-7 text-violet-600" />
                  </div>
                </div>
                <p className="text-sm text-center text-zinc-600">
                  Mã OTP 6 số đã được gửi đến <strong className="text-zinc-900">{email}</strong>
                </p>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                <div className="text-center text-sm text-zinc-600">
                  {resendCountdown > 0 ? (
                    <>Gửi lại mã trong <strong>{resendCountdown}s</strong></>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
                    >
                      Gửi lại mã
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang xác nhận...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex items-center justify-center gap-1 text-violet-600 hover:text-violet-700 font-medium hover:underline transition-all mx-auto"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Thay đổi email
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <EnvelopeIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="block w-full pl-10 pr-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 ml-1">Mật khẩu mới</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockClosedIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 ml-1">Xác nhận mật khẩu</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockClosedIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="block w-full pl-10 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <span>Đặt lại mật khẩu</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
