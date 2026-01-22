import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function RegisterLanding() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50">

      <div className="text-center mb-12 animate-in slide-in-from-bottom-5 duration-700">
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4 tracking-tight">
          Tham gia cùng <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">QuizzZone</span>
        </h1>
        <p className="text-lg text-zinc-500 max-w-lg mx-auto">
          Chọn vai trò của bạn để bắt đầu hành trình học tập và giảng dạy đầy thú vị.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full px-4">

        {/* Teacher Card */}
        <Link
          href="/register/teacher"
          className="group relative bg-white rounded-3xl p-8 shadow-xl shadow-zinc-200/50 border-2 border-transparent hover:border-violet-500/20 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100 rounded-full -mr-16 -mt-16 opacity-50 transition-transform group-hover:scale-150"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-48 h-48 mb-6 relative rounded-2xl overflow-hidden bg-violet-50 p-4 group-hover:shadow-lg transition-shadow">
              <Image
                src="/roles/teacher.png"
                alt="Giáo viên"
                fill
                className="object-contain"
                priority
              />
            </div>

            <h3 className="text-2xl font-bold text-zinc-900 mb-2 group-hover:text-violet-600 transition-colors">Giáo viên</h3>
            <p className="text-zinc-500 text-center text-sm mb-6">
              Tạo bài kiểm tra, quản lý học sinh và theo dõi tiến độ học tập một cách hiệu quả.
            </p>

            <div className="w-full py-3 rounded-xl bg-violet-50 text-violet-700 font-semibold text-center group-hover:bg-violet-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
              Đăng ký Giáo viên
              <ArrowRightIcon className="w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* Student Card */}
        <Link
          href="/register/student"
          className="group relative bg-white rounded-3xl p-8 shadow-xl shadow-zinc-200/50 border-2 border-transparent hover:border-fuchsia-500/20 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-100 rounded-full -mr-16 -mt-16 opacity-50 transition-transform group-hover:scale-150"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-48 h-48 mb-6 relative rounded-2xl overflow-hidden bg-fuchsia-50 p-4 group-hover:shadow-lg transition-shadow">
              <Image
                src="/roles/student.png"
                alt="Học sinh"
                fill
                className="object-contain"
                priority
              />
            </div>

            <h3 className="text-2xl font-bold text-zinc-900 mb-2 group-hover:text-fuchsia-600 transition-colors">Học sinh</h3>
            <p className="text-zinc-500 text-center text-sm mb-6">
              Tham gia làm bài kiểm tra, xem kết quả và nâng cao kiến thức của bản thân.
            </p>

            <div className="w-full py-3 rounded-xl bg-fuchsia-50 text-fuchsia-700 font-semibold text-center group-hover:bg-fuchsia-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
              Đăng ký Học sinh
              <ArrowRightIcon className="w-4 h-4" />
            </div>
          </div>
        </Link>

      </div>

      <div className="mt-12 text-center text-zinc-500">
        Bạn đã có tài khoản?{' '}
        <Link href="/auth/login" className="font-semibold text-violet-600 hover:text-violet-700 hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
