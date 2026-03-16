'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2 } from 'lucide-react';

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-300/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-300/20 blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-md rounded-2xl border border-white/50 bg-white/70 p-10 text-center shadow-xl backdrop-blur-xl"
      >
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-inner"
            >
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </motion.div>
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-amber-500 shadow-md"
            >
              <Clock size={16} strokeWidth={3} />
            </motion.div>
          </div>
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 text-3xl font-extrabold tracking-tight text-zinc-900"
        >
          Đăng ký thành công!
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 text-[15px] leading-relaxed text-zinc-600"
        >
          Tài khoản giáo viên của bạn đã được tạo và đang chờ <span className="font-semibold text-zinc-800">quản trị viên phê duyệt</span>.
          Bạn sẽ nhận được thông báo qua email khi tài khoản được kích hoạt để bắt đầu sử dụng.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <Link 
            href="/" 
            className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(219,39,119,0.5)] active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              Về trang chủ
            </span>
            <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-purple-600 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
