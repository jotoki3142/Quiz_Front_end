'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/apiClient';
import { useUser } from '@/lib/user';
import {
  FileText,
  Users,
  HelpCircle,
  Plus,
  List,
  History,
  User,
  ArrowRight,
  Clock,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Exam {
  id: number;
  title: string;
  description: string;
  duration: number;
  questionCount: number;
  status: string;
  createdAt: string;
}

const TeacherHome = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({ exams: 0, questions: 0, students: 0 });
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const displayName = (() => {
    if (!user) return '';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;
    const rawUser = user.username || (user as any).email || '';
    if (typeof rawUser === 'string' && rawUser.includes('@')) {
      return rawUser.split('@')[0];
    }
    return rawUser;
  })();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch exams
        const examsData = await fetchApi('/exams/my');
        const examsArray = Array.isArray(examsData) ? examsData : [];

        // Calculate stats
        const examsCount = examsArray.length;
        const questionsCount = examsArray.reduce((sum: number, exam: any) => {
          if (typeof exam.questionCount === 'number') return sum + exam.questionCount;
          if (Array.isArray(exam.examQuestions)) return sum + exam.examQuestions.length;
          return sum;
        }, 0);

        // Fetch history for student stats
        // Note: Ideally backend should provide a summary endpoint to avoid heavy frontend processing
        // For now we keep the existing logic but optimized
        const uniqueStudentIds = new Set<number>();
        // Only fetch history for last 5 exams to avoid too many requests if list is long
        // or just accept it might be slow for now, but valid for "redesign" scope
        // Detailed implementation omitted for brevity/performance in this view
        // In a real app, use a dedicated endpoint. For now, let's just use a placeholder or derived if easy.
        // We will stick to the existing logic format but wrap in try/catch

        // Let's assume we maintain the existing logic for getting student count roughly
        // Or simplified for better performance:
        setStats({ exams: examsCount, questions: questionsCount, students: 0 }); // Default 0 for now to speed up

        // Process Recent Exams (Sort by id or createdAt desc)
        // Assuming API returns them, we just take top 3
        const sortedExams = [...examsArray]
          .sort((a, b) => (b.id || 0) - (a.id || 0)) // simplistic sort by ID as proxy for time if createdAt not available
          .slice(0, 3);

        setRecentExams(sortedExams);

        // Try to fetch student count asynchronously
        const fetchStudentCount = async () => {
          try {
            const historyPromises = examsArray.map((exam: any) =>
              fetchApi(`/examHistory/get/${exam.id}`).catch(() => [])
            );
            const results = await Promise.all(historyPromises);
            const ids = new Set();
            results.flat().forEach((h: any) => {
              if (h?.studentId) ids.add(h.studentId);
            });
            setStats(prev => ({ ...prev, students: ids.size }));
          } catch (e) {
            console.error("Error fetching student stats", e);
          }
        };
        fetchStudentCount();

      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white pb-24 pt-10 px-6 sm:px-10 rounded-b-[2.5rem] shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-violet-200 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium backdrop-blur-sm border border-white/10">
                Giáo viên
              </span>
              <span className="text-sm">{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Chào mừng, <span className="text-yellow-300">{displayName}</span>!
            </h1>
            <p className="text-violet-100 text-lg max-w-xl">
              Quản lý đề thi, câu hỏi và theo dõi tiến độ học tập của học viên một cách hiệu quả.
            </p>
          </motion.div>

          {/* Optional: Tiny right-side illustration or just spacing */}
          <div className="hidden md:block">
            {/* <img ... /> */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-16">
        {/* Stats Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-lg border border-purple-50 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Tổng số bài thi</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.exams}</h3>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-lg border border-fuchsia-50 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-xl">
                <HelpCircle size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Ngân hàng câu hỏi</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.questions}</h3>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-lg border border-pink-50 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 text-pink-600 rounded-xl">
                <Users size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Học viên tham gia</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.students}</h3>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions (Left Column - 2/3 width on large screens? Or 1/3? Let's do 2 col layout) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Shortcuts */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Truy cập nhanh</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link href="/teacher/list-exam" className="group">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-full group-hover:scale-110 transition-transform">
                      <List size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm text-center">Quản lý bài thi</span>
                  </div>
                </Link>

                <Link href="/teacher/questions" className="group">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:border-fuchsia-200 hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-full group-hover:scale-110 transition-transform">
                      <HelpCircle size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm text-center">Ngân hàng câu hỏi</span>
                  </div>
                </Link>

                <Link href="/teacher/history-exam" className="group">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:border-pink-200 hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="p-3 bg-pink-50 text-pink-600 rounded-full group-hover:scale-110 transition-transform">
                      <History size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm text-center">Lịch sử thi</span>
                  </div>
                </Link>

                <Link href="/teacher/profile" className="group">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-full group-hover:scale-110 transition-transform">
                      <User size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm text-center">Hồ sơ cá nhân</span>
                  </div>
                </Link>
              </div>
            </section>

            {/* Banner / Promotion / Tips */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Mẹo cho giáo viên</h3>
                <p className="text-indigo-100 mb-4 text-sm max-w-md">
                  Bạn có thể tạo các bài thi Online với tính năng giám sát thời gian thực để đảm bảo tính công bằng cho học viên.
                </p>
                <Link href="/teacher/list-exam">
                  <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors">
                    Tạo bài thi mới ngay
                  </button>
                </Link>
              </div>
              {/* Decorative circles */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute top-0 right-20 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            </div>
          </div>

          {/* Recent Activity (Right Column) */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Bài thi gần đây</h2>
              <Link href="/teacher/list-exam" className="text-violet-600 text-sm font-semibold hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
              {isLoading ? (
                <div className="p-4 text-center text-gray-400">Đang tải...</div>
              ) : recentExams.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center text-gray-400">
                  <FileText className="mb-2 opacity-20" size={40} />
                  <p>Chưa có bài thi nào</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentExams.map((exam) => (
                    <div key={exam.id} className="group p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 line-clamp-1 group-hover:text-violet-600 transition-colors">
                            {exam.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {exam.description || 'Không có mô tả'}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider
                                            ${exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-600' :
                            exam.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                              'bg-orange-100 text-orange-600'
                          }`}
                        >
                          {exam.status === 'PUBLISHED' ? 'Đã đăng' : exam.status === 'DRAFT' ? 'Nháp' : exam.status}
                        </span>
                      </div>

                      <div className="flex items-end justify-between mt-3">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{exam.duration}p</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HelpCircle size={12} />
                            <span>{exam.questionCount} câu</span>
                          </div>
                        </div>

                        <Link href={`/teacher/update-exam/${exam.id}`}>
                          <button className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-violet-100 hover:text-violet-600 transition-colors">
                            <ArrowRight size={16} />
                          </button>
                        </Link>
                        {/* Note: Ideally link to edit page based on id. Assuming create-exam?id=X or update-exam/[id] */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;
