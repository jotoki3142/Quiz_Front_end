"use client";

import React from "react";
import Link from "next/link";
import { QuestionMarkCircleIcon, CheckBadgeIcon, BoltIcon } from "@heroicons/react/24/solid";

import DefaultLayout from "./default-layout";

export default function Home() {
  const features = [
    {
      title: "Ngân hàng câu hỏi thông minh",
      description: "Tạo câu hỏi với nhiều thể loại: một đáp án, nhiều đáp án, đúng/sai.",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      ),
      color: "from-violet-500 to-indigo-500",
    },
    {
      title: "Tạo bài thi chuyên nghiệp",
      description: "Tùy chỉnh mức độ khó, thời gian làm bài, và cấu trúc đề thi linh hoạt.",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-fuchsia-500 to-pink-500",
    },
    {
      title: "Phân tích kết quả chi tiết",
      description: "Xem điểm số, đáp án đúng/sai và biểu đồ thống kê năng lực theo thời gian.",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      color: "from-amber-400 to-orange-500",
    },
  ];

  return (
    <DefaultLayout>
      <div className="w-full flex flex-col gap-16 pb-20">

        {/* Hero Section */}
        <section className="relative w-full overflow-hidden px-4 md:px-8 pt-12 lg:pt-20">
          <div className="relative mx-auto max-w-7xl rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl shadow-zinc-900/20">
            {/* Background Image with Overlay */}
            <div
              className="absolute inset-0 z-0 opacity-80"
              style={{
                backgroundImage: "url('/roles/home.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "right center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent z-0"></div>

            <div className="relative z-10 flex flex-col items-start gap-8 px-8 py-16 md:px-16 md:py-24 text-white max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                <span className="mr-2 flex h-2 w-2">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                </span>
                Nền tảng giáo dục 4.0
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Nâng tầm tri thức cùng <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">QuizzZone</span>
              </h1>
              <p className="text-lg text-zinc-300 leading-relaxed max-w-xl">
                Hệ thống thi trắc nghiệm trực tuyến hiện đại. Tạo đề thi, quản lý học sinh và phân tích kết quả — tất cả trong một nền tảng duy nhất.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth/login"
                  className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-zinc-900 shadow-xl shadow-white/10 transition-all hover:scale-105 hover:bg-zinc-100"
                >
                  Bắt đầu ngay
                </Link>
                <Link
                  href="#features"
                  className="rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Tìm hiểu thêm
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mx-auto w-full max-w-7xl px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl shadow-zinc-200/50 border border-white/50 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150`}></div>

                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg shadow-violet-500/20 text-white`}>
                  {feature.icon}
                </div>

                <h3 className="mb-3 text-xl font-bold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="text-zinc-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DefaultLayout>
  );
}