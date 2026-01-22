"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowRightIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

interface Exam {
  examId: number;
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  questionCount: number;
  status?: string;
}

export default function HistoryExamPage() {
  const router = useRouter();

  // OFFLINE STATE
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ==================== FETCH OFFLINE EXAMS ====================
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await fetchApi("/exams/my");
        const validExams = Array.isArray(data)
          ? data.filter((e: any) => e.status !== "DRAFT")
          : [];

        const mapped: Exam[] = validExams.map((e: any) => ({
          examId: e.examId,
          title: e.title,
          startTime: e.startTime
            ? new Date(e.startTime).toLocaleString("vi-VN")
            : "Không giới hạn",
          endTime: e.endTime
            ? new Date(e.endTime).toLocaleString("vi-VN")
            : "Không giới hạn",
          durationMinutes: e.durationMinutes,
          questionCount: e.questionCount || e.examQuestions?.length || 0,
          status: calculateStatus(e.startTime, e.endTime),
        }));

        setExams(mapped);
      } catch (error) {
        console.error("Fetch exams error:", error);
        toast.error("Không thể tải danh sách bài thi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  // ==================== UTIL: STATUS ====================
  const calculateStatus = (start?: string, end?: string) => {
    const now = new Date();
    if (end && new Date(end) < now) return "Đã kết thúc";
    if (start && new Date(start) > now) return "Chưa bắt đầu";
    return "Đang diễn ra";
  };

  const navigateToDetail = (examId: number) => {
    router.push(`/teacher/list-history-exam?examId=${examId}`);
  };

  // Filter logic
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#A53AEC] to-fuchsia-600 shadow-xl shadow-purple-200 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black/10 blur-3xl"></div>

          <div className="relative p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <ClipboardDocumentListIcon className="w-10 h-10 text-violet-200" />
                  Lịch sử thi Offline
                </h1>
                <p className="text-violet-100 mt-2 text-lg opacity-90 max-w-2xl">
                  Theo dõi và xem lại kết quả các bài thi offline đã được tổ chức.
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex p-1 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                <button
                  onClick={() => router.push("/teacher/list-exam")}
                  className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Bài thi
                </button>
                <button className="px-4 py-2 rounded-lg bg-white text-[#A53AEC] font-bold shadow-sm transition-all text-sm">
                  Lịch sử Offline
                </button>
                <button
                  onClick={() => router.push("/teacher/history-exam-online")}
                  className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Lịch sử Online
                </button>
              </div>
            </div>

            {/* Filter Bar (White Style) */}
            <div className="mt-8 p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 min-w-[200px] group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400 group-focus-within:text-violet-600 transition-colors" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên bài thi..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm font-medium shadow-sm"
                />
              </div>

              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-xs font-semibold text-zinc-500">Từ:</span>
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium shadow-sm"
                  />
                </div>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-xs font-semibold text-zinc-500">Đến:</span>
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium shadow-sm"
                  />
                </div>
                <button className="px-6 py-3 bg-[#A53AEC] text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4" /> Lọc
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm min-h-[500px] p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-[#A53AEC] rounded-full animate-spin mb-4"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50">
              <ClipboardDocumentListIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium text-zinc-500">Chưa có bài thi nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredExams.map((exam) => (
                <HistoryCard key={exam.examId} exam={exam} onDetail={() => navigateToDetail(exam.examId)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

const HistoryCard = ({ exam, onDetail }: { exam: Exam, onDetail: () => void }) => {
  const isEnded = exam.status === "Đã kết thúc";
  const isUpcoming = exam.status === "Chưa bắt đầu";
  const isRunning = exam.status === "Đang diễn ra";

  let statusColor = "bg-zinc-100 text-zinc-600";
  if (isEnded) statusColor = "bg-rose-50 text-rose-600 border border-rose-100";
  if (isRunning) statusColor = "bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse";
  if (isUpcoming) statusColor = "bg-amber-50 text-amber-600 border border-amber-100";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-lg transition-all hover:border-purple-200 group flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {exam.status}
        </span>
        <div className="p-2 bg-purple-50 text-[#A53AEC] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <ChartBarIcon className="w-5 h-5" />
        </div>
      </div>

      <h3 className="font-bold text-zinc-900 text-lg mb-2 line-clamp-2" title={exam.title}>
        {exam.title}
      </h3>

      <div className="space-y-2.5 mb-6 flex-1">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <ClockIcon className="w-4 h-4 text-zinc-400" />
          <span className="font-medium">{exam.durationMinutes} phút</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <DocumentTextIcon className="w-4 h-4 text-zinc-400" />
          <span>{exam.questionCount} câu hỏi</span>
        </div>
        <div className="pt-2 border-t border-zinc-50 mt-2 space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-4 text-center">BĐ:</span>
            <span>{exam.startTime}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-4 text-center">KT:</span>
            <span>{exam.endTime}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onDetail}
        className="w-full py-2.5 rounded-xl bg-purple-50 text-[#A53AEC] font-bold text-sm hover:bg-[#A53AEC] hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-purple-100"
      >
        Xem lịch sử <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
