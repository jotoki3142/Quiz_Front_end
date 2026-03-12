"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import {
  PencilSquareIcon,
  ClockIcon,
  CalendarIcon,
  TagIcon,
  SwatchIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  PresentationChartLineIcon,
  BookOpenIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

// TYPES
type QuestionTypeOption = { id: string; name: string };
type DifficultyOption = { id: string; name: string };
type ExamStatus = 'DRAFT' | 'PUBLISHED';

interface Category {
  id: number;
  name: string;
}

export default function CreateExamPage() {
  const router = useRouter();

  // ======= STATE =======
  const [examCategory, setExamCategory] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examType, setExamType] = useState("");
  const [duration, setDuration] = useState<number | "">(0);
  const [startTime, setStartTime] = useState("00:00");
  const [startDate, setStartDate] = useState("");
  const [endTime, setEndTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Options
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<DifficultyOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingOptions(true);
      try {
        const [categoriesRes, difficultiesRes] = await Promise.all([
          fetchApi('/categories/all'),
          fetchApi('/questions/difficulties'),
        ]);

        setCategoryOptions(categoriesRes);

        const difficultyMap: Record<string, string> = {
          'EASY': 'Dễ',
          'MEDIUM': 'Trung bình',
          'HARD': 'Khó'
        };

        const formattedDifficulties = Array.isArray(difficultiesRes) ? difficultiesRes.map((d: any) => {
          const val = typeof d === 'string' ? d : d.name;
          return { id: val, name: difficultyMap[val] || val };
        }) : [];
        setDifficultyOptions(formattedDifficulties);

      } catch (error) {
        toastError("Không thể tải các tùy chọn.");
        console.error("Failed to fetch dropdown options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchDropdownData();
  }, []);

  const handleSubmit = async (status: ExamStatus) => {
    // Helper to format local date and time for payload
    const formatLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    if (!examTitle.trim()) {
      toastError("Vui lòng nhập tên bài thi");
      return;
    }
    if (!examType) {
      toastError("Vui lòng chọn độ khó");
      return;
    }
    if (!examCategory) {
      toastError("Vui lòng chọn danh mục");
      return;
    }
    if (!duration || Number(duration) <= 0) {
      toastError("Thời gian làm bài phải lớn hơn 0");
      return;
    }

    if (!startDate || !startTime) {
      toastError("Vui lòng chọn ngày và giờ bắt đầu");
      return;
    }

    const now = new Date();
    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    if (isNaN(startDateTime.getTime())) {
      toastError("Thời gian bắt đầu không hợp lệ");
      return;
    }

    // Check if start time is in the past, accounting for local timezone differences
    const nowLocalString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const nowLocal = new Date(nowLocalString);

    if (startDateTime < nowLocal) {
      toastError("Thời gian bắt đầu phải lớn hơn hoặc bằng thời gian hiện tại");
      return;
    }

    if (!endDate || !endTime) {
      toastError("Vui lòng chọn ngày và giờ kết thúc");
      return;
    }

    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    if (isNaN(endDateTime.getTime())) {
      toastError("Thời gian kết thúc không hợp lệ");
      return;
    }

    if (endDateTime <= startDateTime) {
      toastError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    setIsSubmitting(true);
    try {
      const questionIds: number[] = [];

      const examPayload = {
        title: examTitle,
        categoryId: examCategory,
        durationMinutes: Number(duration),
        startTime: formatLocal(startDateTime),
        endTime: formatLocal(endDateTime),
        questionIds: questionIds,
        description: `Bài thi ${examType}`,
        examLevel: examType.toUpperCase(),
        status: status
      };
      await fetchApi('/exams/create', {
        method: 'POST',
        body: examPayload
      });

      toastSuccess("Tạo bài thi thành công! (Đã lưu nháp)");
      router.push('/teacher/list-exam');

    } catch (error: any) {
      console.error("Error creating exam:", error);
      toastError(error.message || "Có lỗi xảy ra khi tạo bài thi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#A53AEC] to-fuchsia-600 shadow-xl shadow-purple-200 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black/10 blur-3xl"></div>

          <div className="relative p-8 text-white">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <PresentationChartLineIcon className="w-10 h-10 text-violet-200" />
              Tạo Bài Thi Offline
            </h1>
            <p className="text-violet-100 mt-2 text-lg opacity-90 max-w-2xl">
              Thiết lập thông tin cho kỳ thi offline mới.
            </p>
          </div>
        </div>

        <main className="px-4 md:px-0">
          <section className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 max-w-5xl mx-auto">
            {/* Steps / Navigation */}
            <div className="flex gap-4 p-1 bg-zinc-100/50 rounded-xl mb-8 w-fit">
              <button onClick={() => router.push('/teacher/exam-offline')} className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#A53AEC] font-bold rounded-lg shadow-sm border border-zinc-200/50 transition-all">
                <BookOpenIcon className="w-5 h-5" />
                Bài thi Offline
              </button>
              <button onClick={() => router.push('/teacher/exam-online')} className="flex items-center gap-2 px-6 py-2.5 text-zinc-500 font-medium hover:text-[#A53AEC] hover:bg-white/50 rounded-lg transition-all">
                <GlobeAltIcon className="w-5 h-5" />
                Bài thi Online
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Information Block */}
              <div>
                <h3 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#A53AEC] rounded-full"></span>
                  Thông tin chung
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tên bài thi</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
                        placeholder="Nhập tên bài thi..."
                      />
                      <PencilSquareIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Loại đề thi</label>
                      <div className="relative">
                        <select
                          value={examType}
                          onChange={(e) => setExamType(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer text-sm"
                          disabled={loadingOptions}
                        >
                          <option value="">{loadingOptions ? "Đang tải..." : "Chọn độ khó"}</option>
                          {difficultyOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                        <SwatchIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Danh mục</label>
                      <div className="relative">
                        <select
                          value={examCategory}
                          onChange={(e) => setExamCategory(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer text-sm"
                          disabled={loadingOptions}
                        >
                          <option value="">{loadingOptions ? "Đang tải..." : "Chọn danh mục"}</option>
                          {categoryOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                        <TagIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Block */}
              <div>
                <h3 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-fuchsia-500 rounded-full"></span>
                  Thời gian & Cài đặt
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Thời gian làm bài</label>
                    <div className="relative w-full md:w-48">
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) =>
                          setDuration(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full pl-10 pr-12 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-zinc-800 text-sm"
                        min="1"
                        placeholder="0"
                      />
                      <ClockIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">Phút</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                      <label className="block text-sm font-bold text-[#A53AEC] mb-3 flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" /> Bắt đầu
                      </label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 text-sm"
                          />
                        </div>
                        <div className="relative flex-[2]">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 text-sm"
                          />
                          <CalendarIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                      <label className="block text-sm font-bold text-fuchsia-700 mb-3 flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" /> Kết thúc
                      </label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 focus:border-fuchsia-500 text-sm"
                          />
                        </div>
                        <div className="relative flex-[2]">
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 focus:border-fuchsia-500 text-sm"
                          />
                          <CalendarIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-end gap-4 pt-6 border-t border-zinc-100">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border-2 border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleSubmit('DRAFT')}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-[#A53AEC] to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-70 text-sm"
              >
                {isSubmitting ? (
                  <>Đang xử lý...</>
                ) : (
                  <>
                    <PlusCircleIcon className="w-5 h-5" />
                    Tạo bài thi
                  </>
                )}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
