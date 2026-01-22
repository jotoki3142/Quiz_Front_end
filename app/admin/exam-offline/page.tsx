"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from '@/lib/apiClient';
import { toastError, toastSuccess } from '@/lib/toast';
import {
  PencilSquareIcon,
  ClockIcon,
  CalendarIcon,
  TagIcon,
  SwatchIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  BookOpenIcon,
  PresentationChartLineIcon
} from "@heroicons/react/24/outline";

// TYPES

interface Option {
  id: number | string;
  name: string;
}

type Answer = {
  id: number;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: number;
  title: string;
  questionType: string;
  category: string;
  difficulty: string;
  answers: Answer[];
};

// API Endpoints
const ENDPOINTS = {
  types: '/questions/question-types',
  difficulties: '/questions/difficulties',
  categories: '/categories/all',
};

// Helper function to fetch data
const fetchOptions = async (url: string, fallback: Option[] = []) => {
  try {
    const res = await fetchApi(url);
    // Assuming the API returns an array of objects with 'id' and 'name'
    const data = Array.isArray(res) ? res.map((item: any) => {
      if (typeof item === 'string') {
        return { id: item, name: item };
      }
      return { id: item.id || item.name, name: item.name };
    }) : fallback;
    return data;
  } catch (error) {
    console.error(`Error fetching options from ${url}:`, error);
    toastError(`Failed to load options from ${url.split('/').pop()}.`);
    return fallback;
  }
};


// COMPONENT CHÍNH

export default function CreateExamPage() {
  // ======= STATE BÀI THI =======
  const [examCategory, setExamCategory] = useState("");
  const [examTitle, setExamTitle] = useState("");
  // const [questionCount, setQuestionCount] = useState<number | "">(""); // Removed
  const [examType, setExamType] = useState(""); // This will store difficulty ID/name for the exam
  const [duration, setDuration] = useState<number | "">(0);
  const [startTime, setStartTime] = useState("00:00");
  const [startDate, setStartDate] = useState("");
  const [endTime, setEndTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");

  // ======= STATE CHO CÁC TÙY CHỌN ĐỘNG =======
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<Option[]>([]);
  const [questionTypeOptions, setQuestionTypeOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch dynamic options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      const [categories, difficulties, types] = await Promise.all([
        fetchOptions(ENDPOINTS.categories),
        fetchOptions(ENDPOINTS.difficulties),
        fetchOptions(ENDPOINTS.types),
      ]);
      setCategoryOptions(categories);

      const difficultyMap: Record<string, string> = {
        'EASY': 'Dễ',
        'MEDIUM': 'Trung bình',
        'HARD': 'Khó'
      };
      const mappedDifficulties = difficulties.map((d: Option) => ({
        ...d,
        name: difficultyMap[d.name] || d.name
      }));
      setDifficultyOptions(mappedDifficulties);

      setQuestionTypeOptions(types);
      setLoadingOptions(false);
    };
    loadOptions();
  }, []);


  // ======= STATE CÂU HỎI =======
  const [questions, setQuestions] = useState<Question[]>([]);

  const removeQuestion = (questionId: number) => {
    if (questions.length === 1) {
      alert("Phải có ít nhất 1 câu hỏi");
      return;
    }
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const updateQuestionField = (
    qid: number,
    field: keyof Question,
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            [field]: value,
          }
          : q
      )
    );
  };

  const addAnswer = (qid: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qid) {
          const newAnswerId = q.answers.length > 0 ? q.answers[q.answers.length - 1].id + 1 : 1;
          return {
            ...q,
            answers: [
              ...q.answers,
              { id: newAnswerId, text: "", isCorrect: false },
            ],
          };
        }
        return q;
      })
    );
  };

  const removeAnswer = (qid: number, aid: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            answers: q.answers.length > 2 ? q.answers.filter((a) => a.id !== aid) : q.answers, // Keep at least 2 answers
          }
          : q
      )
    );
  };

  const updateAnswerText = (qid: number, aid: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? {
            ...q,
            answers: q.answers.map((a) =>
              a.id === aid ? { ...a, text: value } : a
            ),
          }
          : q
      )
    );
  };

  // TYPES
  type QuestionTypeOption = { id: string; name: string };
  type DifficultyOption = { id: string; name: string };

  type ExamStatus = 'DRAFT' | 'PUBLISHED';

  interface Category {
    id: number;
    name: string;
  }

  interface Question {
    id: number;
    title: string;
    type: string;
    level: string;
    correctAnswer: string;
    answers: { id: number; text: string; isCorrect: boolean }[];
    category: { id: number; name: string };
    difficulty?: string;
    createdBy?: string;
  }

  interface Exam {
    title: string;
    description: string;
    durationMinutes: number;
    categoryId: number;
    examLevel: string;
    status: ExamStatus;
  }
  //... (keeping imports and other parts same, targeting handleCreateExam)

  const handleCreateExam = async (status: ExamStatus) => {
    // 1. Validation
    if (!examTitle.trim()) {
      toastError("Vui lòng nhập tên bài thi");
      return;
    }
    if (!examCategory) {
      toastError("Vui lòng chọn danh mục");
      return;
    }

    if (!examType) {
      toastError("Vui lòng chọn độ khó");
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
    if (startDateTime < now) {
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


    try {
      // 2. Prepare question IDs
      const questionIds: number[] = []; // Empty initially

      // 3. Create Exam
      const examPayload = {
        title: examTitle,
        categoryId: examCategory,
        durationMinutes: Number(duration),
        startTime: `${startDate}T${startTime}:00`,
        endTime: `${endDate}T${endTime}:00`,
        questionIds: questionIds,
        description: `Bài thi ${examType}`,
        examLevel: examType.toUpperCase(),
        status: status
      };

      await fetchApi('/exams/create', {
        method: 'POST',
        body: examPayload
      });

      toastSuccess(status === 'DRAFT' ? "Đã lưu nháp!" : "Đã đăng bài thành công!");
      // Reset form or redirect? For now just notify.
      // Redirect to list
      window.location.href = '/admin/list-exam';

    } catch (error: any) {
      console.error("Error creating exam:", error);
      toastError(error.message || "Có lỗi xảy ra khi tạo bài thi");
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-xl shadow-violet-200 animate-in fade-in slide-in-from-top-4 duration-500">
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
            <div className="flex gap-4 p-1 bg-zinc-100/50 rounded-xl mb-8 w-fit">
              <a href="/admin/exam-offline" className="flex items-center gap-2 px-6 py-2.5 bg-white text-violet-600 font-bold rounded-lg shadow-sm border border-zinc-200/50 transition-all">
                <BookOpenIcon className="w-5 h-5" />
                Bài thi Offline
              </a>
              <a href="/admin/exam-online" className="flex items-center gap-2 px-6 py-2.5 text-zinc-500 font-medium hover:text-violet-600 hover:bg-white/50 rounded-lg transition-all">
                <GlobeAltIcon className="w-5 h-5" />
                Bài thi Online
              </a>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Information Block */}
              <div>
                <h3 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
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
                        className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
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
                          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all appearance-none cursor-pointer"
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
                          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all appearance-none cursor-pointer"
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
                        className="w-full pl-10 pr-12 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-bold text-zinc-800"
                        min="1"
                        placeholder="0"
                      />
                      <ClockIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">Phút</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                      <label className="block text-sm font-bold text-violet-700 mb-3 flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" /> Bắt đầu
                      </label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500"
                          />
                        </div>
                        <div className="relative flex-[2]">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500"
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
                            className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 focus:border-fuchsia-500"
                          />
                        </div>
                        <div className="relative flex-[2]">
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 focus:border-fuchsia-500"
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
                onClick={() => window.location.href = '/admin/list-exam'}
                className="px-6 py-3 border-2 border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleCreateExam('DRAFT')}
                className="px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Tạo bài thi
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
