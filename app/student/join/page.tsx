"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toastError } from "@/lib/toast";
import { LogIn, Keyboard, Shield, Sparkles } from "lucide-react";

export default function StudentJoinPage() {
    const [code, setCode] = useState("");
    const router = useRouter();

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) {
            toastError("Vui lòng nhập mã truy cập");
            return;
        }
        router.push(`/student/waiting-room/${code.trim()}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Main Card */}
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-2xl p-8 md:p-10 transform transition-all hover:scale-[1.01] relative z-10 border border-white/20">
                {/* Header with Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-purple-500/50 animate-bounce">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
                        Tham gia bài thi
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Nhập mã truy cập để vào phòng chờ
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Keyboard className="w-4 h-4 text-indigo-600" />
                            Mã truy cập bài thi
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="VD: ABC123"
                                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all text-center text-2xl font-bold tracking-[0.5em] uppercase bg-gray-50 hover:bg-white"
                                autoFocus
                                maxLength={10}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Shield className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Mã do giáo viên cung cấp
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-600/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <LogIn size={24} />
                        Vào phòng chờ
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500 font-medium">hoặc</span>
                    </div>
                </div>

                {/* QR Code Info */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">Quét mã QR</h3>
                            <p className="text-sm text-gray-600">
                                Sử dụng camera điện thoại để quét mã QR từ màn hình giáo viên
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Hint */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                        <Shield className="w-3 h-3" />
                        Kết nối an toàn và bảo mật
                    </p>
                </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-10 right-10 hidden lg:block animate-float">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl rotate-12 shadow-xl"></div>
            </div>
            <div className="absolute bottom-10 left-10 hidden lg:block animate-float" style={{ animationDelay: '1s' }}>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full shadow-xl"></div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
