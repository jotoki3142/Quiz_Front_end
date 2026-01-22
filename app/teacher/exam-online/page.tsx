"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  GlobeAltIcon,
  CloudIcon,
  PencilSquareIcon,
  TagIcon,
  SwatchIcon,
  ClockIcon,
  UsersIcon,
  InformationCircleIcon,
  BookOpenIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

interface Category {
  id: number;
  name: string;
}

export default function CreateOnlineExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");

  useEffect(() => {
    fetchApi("/categories/all")
      .then(setCategories)
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        toastError("Không thể tải danh mục");
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toastError("Vui lòng nhập tên bài thi");
      return;
    }
    if (!categoryId) {
      toastError("Vui lòng chọn danh mục");
      return;
    }
    if (!level) {
      toastError("Vui lòng chọn độ khó");
      return;
    }
    if (!durationMinutes || durationMinutes <= 0) {
      toastError("Thời gian làm bài phải lớn hơn 0");
      return;
    }
    if (!maxParticipants || maxParticipants <= 0) {
      toastError("Số người tham gia phải lớn hơn 0");
      return;
    }

    const payload = {
      name: name.trim(),
      categoryId: parseInt(categoryId),
      level: level,
      durationMinutes: Number(durationMinutes),
      passingScore: 5, // Default passing score
      maxParticipants: Number(maxParticipants),
    };

    try {
      setLoading(true);
      const response = await fetchApi("/online-exams/create", {
        method: "POST",
        body: payload,
      });

      toastSuccess("Tạo bài thi thành công!");
      // Redirect to add questions page
      router.push(`/teacher/exam-online/edit/${response.id}`);
    } catch (error: any) {
      console.error("Failed to create exam:", error);
      toastError(error.message || "Không thể tạo bài thi");
    } finally {
      setLoading(false);
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
              <CloudIcon className="w-10 h-10 text-violet-200" />
              Tạo Bài Thi Online
            </h1>
            <p className="text-violet-100 mt-2 text-lg opacity-90 max-w-2xl">
              Thiết lập cấu hình và thông số cho kỳ thi trực tuyến mới.
            </p>
          </div>
        </div>

        <main className="px-4 md:px-0">
          <section className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 max-w-5xl mx-auto">
            {/* Steps / Navigation */}
            <div className="flex gap-4 p-1 bg-zinc-100/50 rounded-xl mb-8 w-fit">
              <button
                onClick={() => router.push('/teacher/exam-offline')}
                className="flex items-center gap-2 px-6 py-2.5 text-zinc-500 font-medium hover:text-[#A53AEC] hover:bg-white/50 rounded-lg transition-all"
              >
                <BookOpenIcon className="w-5 h-5" />
                Bài thi Offline
              </button>
              <button
                onClick={() => router.push('/teacher/exam-online')}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#A53AEC] font-bold rounded-lg shadow-sm border border-zinc-200/50 transition-all"
              >
                <GlobeAltIcon className="w-5 h-5" />
                Bài thi Online
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
              {/* Information Block */}
              <div>
                <h3 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#A53AEC] rounded-full"></span>
                  Thông tin cơ bản
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tên bài thi <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        placeholder="Nhập tên bài thi..."
                      />
                      <PencilSquareIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Danh mục <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <TagIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Độ khó <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Chọn độ khó</option>
                          <option value="EASY">Dễ</option>
                          <option value="MEDIUM">Trung bình</option>
                          <option value="HARD">Khó</option>
                        </select>
                        <SwatchIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Block */}
              <div>
                <h3 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-fuchsia-500 rounded-full"></span>
                  Thiết lập
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Thời gian làm bài <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={durationMinutes}
                        onChange={(e) =>
                          setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full pl-10 pr-12 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-zinc-800"
                        placeholder="60"
                      />
                      <ClockIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">Phút</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Số lượng tham gia tối đa <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={maxParticipants}
                        onChange={(e) =>
                          setMaxParticipants(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full pl-10 pr-12 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-zinc-800"
                        placeholder="50"
                      />
                      <UsersIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">Người</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-zinc-100 mt-2">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 max-w-lg">
                  <InformationCircleIcon className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Lưu ý:</strong> Sau khi tạo, bạn sẽ được chuyển đến trang <strong>Soạn câu hỏi</strong>.
                    Bài thi sẽ ở trạng thái <strong>Nháp (DRAFT)</strong> cho đến khi bạn hoàn tất nội dung.
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 md:flex-none px-6 py-3 border-2 border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all text-center"
                    disabled={loading}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-[#A53AEC] to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 min-w-[160px]"
                  >
                    {loading ? (
                      "Đang tạo..."
                    ) : (
                      <>Tạo bài thi <ArrowRightIcon className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}