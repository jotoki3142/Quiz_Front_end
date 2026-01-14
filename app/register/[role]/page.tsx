'use client';

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

export default function RegisterFormPage({ params }: { params: Promise<{ role: string }> }) {
  const router = useRouter();
  const { role } = use(params);
  const roleParam = (role || '').toLowerCase();
  const isStudent = roleParam === 'student';
  const isTeacher = roleParam === 'teacher';
  const apiRole = isStudent ? 'STUDENT' : isTeacher ? 'TEACHER' : '';
  const roleLabel = isStudent ? 'Học sinh' : isTeacher ? 'Giáo viên' : 'Người dùng';

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMismatch = confirmPassword && password !== confirmPassword;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!apiRole) {
      setError("Đường dẫn không hợp lệ. Vui lòng chọn vai trò đăng ký.");
      return;
    }
    if (passwordMismatch) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password,
          role: apiRole,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Đăng ký thất bại");
        setLoading(false);
        return;
      }

      toast.success("Đăng ký thành công!");
      if (isTeacher) {
        setTimeout(() => router.push("/register/pending-approval"), 1200);
      } else {
        setTimeout(() => router.push("/auth/login"), 1200);
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  // Visual configuration based on role
  const themeColor = isTeacher ? 'violet' : 'fuchsia';
  const gradientFrom = isTeacher ? 'from-violet-600' : 'from-fuchsia-600';
  const gradientTo = isTeacher ? 'to-indigo-600' : 'to-pink-600';
  const lightGradient = isTeacher ? 'from-violet-50 to-indigo-50' : 'from-fuchsia-50 to-pink-50';
  const RoleIcon = isTeacher ? AcademicCapIcon : UserGroupIcon;

  return (
    <div className={`min-h-screen w-full flex bg-gradient-to-br ${lightGradient}`}>

      {/* Left Decoration Section - Dynamic based on role */}
      <div className={`hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br ${gradientFrom} ${gradientTo} p-12 text-white flex-col justify-between`}>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-black/10 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
              <RoleIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Đăng ký {roleLabel}</h1>
          </div>
          <p className="text-white/90 text-lg max-w-md leading-relaxed">
            {isTeacher
              ? "Tham gia cộng đồng giáo viên để tạo bài giảng, quản lý lớp học và truyền cảm hứng cho học sinh."
              : "Bắt đầu hành trình học tập, thi đua và chinh phục kiến thức mới mỗi ngày."
            }
          </p>
        </div>

        <div className="relative z-10 flex justify-center my-8">
          <div className="relative w-full max-w-md aspect-square bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            {/* Placeholder for role-specific illustration */}
            <img
              src={isTeacher ? "/roles/teacher.png" : "/roles/student.png"}
              alt={roleLabel}
              className="w-full h-full object-contain p-8 transform hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/70">
          &copy; {new Date().getFullYear()} QuizzZone Inc. All rights reserved.
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-zinc-200/50 border border-white my-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Tạo tài khoản mới</h2>
            <p className="text-zinc-500">
              Nhập thông tin chi tiết để bắt đầu.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 ml-1">Tên hiển thị</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="block w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none text-zinc-900 placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 ml-1">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LockClosedIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <p className="text-xs text-zinc-500 ml-1">Ít nhất 6 ký tự</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 ml-1">Nhập lại mật khẩu</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LockClosedIcon className={`w-5 h-5 transition-colors ${passwordMismatch ? 'text-rose-400' : 'text-zinc-400 group-focus-within:text-violet-500'}`} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-12 py-3 bg-zinc-50 border rounded-xl outline-none text-zinc-900 placeholder:text-zinc-400 transition-all ${passwordMismatch
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-zinc-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                    }`}
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
              {passwordMismatch && (
                <p className="text-xs text-rose-600 ml-1 animate-in slide-in-from-top-1">Mật khẩu không khớp</p>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium animate-in slide-in-from-top-2 flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${isTeacher ? 'bg-violet-600 hover:bg-violet-700' : 'bg-fuchsia-600 hover:bg-fuchsia-700'
                }`}
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang đăng ký...</span>
                </>
              ) : (
                <>
                  <span>Đăng ký {roleLabel}</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Bạn đã có tài khoản?{' '}
              <Link href="/auth/login" className={`font-semibold hover:underline transition-all ${isTeacher ? 'text-violet-600 hover:text-violet-700' : 'text-fuchsia-600 hover:text-fuchsia-700'
                }`}>
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

