
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useUser } from '@/lib/user';
import { fetchApi } from '@/lib/apiClient';
import {
    PlayCircleIcon,
    TrophyIcon,
    FireIcon,
    ClockIcon,
    ArrowRightIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon
} from '@heroicons/react/24/solid';

interface HotExam {
    id: number;
    title: string;
    questionCount: number;
    level: string;
    duration: string;
    startTime: string;
    endTime: string;
    status?: 'BEFORE' | 'READY' | 'ENDED' | 'UNKNOWN';
}

const StudentHomeContent = () => {
    const router = useRouter();
    const { user } = useUser();

    const [roomCode, setRoomCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [hotExams, setHotExams] = useState<HotExam[]>([]);
    const [completedExams, setCompletedExams] = useState<number | null>(null);
    const [averageScore, setAverageScore] = useState<number | null>(null);

    const displayName = user?.firstName || user?.username || 'Học viên';

    useEffect(() => {
        const fetchHotExams = async () => {
            try {
                const response = await fetchApi(`/student/exams/search`);
                const data = response?.content || response?.data || [];

                if (!Array.isArray(data)) {
                    setHotExams([]);
                    return;
                }

                const sorted = [...data].sort((a: any, b: any) => {
                    // Sort logic kept same as before for consistency
                    const attemptsA = a.attemptCount || a.timesTaken || 0;
                    const attemptsB = b.attemptCount || b.timesTaken || 0;
                    if (attemptsA !== attemptsB) return attemptsB - attemptsA;
                    return (b.questionCount || 0) - (a.questionCount || 0);
                });

                const topExams: HotExam[] = sorted.slice(0, 4).map((exam: any) => {
                    const now = new Date();
                    const start = exam.startTime ? new Date(exam.startTime) : null;
                    const end = exam.endTime ? new Date(exam.endTime) : null;

                    let status: HotExam['status'] = 'UNKNOWN';
                    if (start && end) {
                        if (now < start) status = 'BEFORE';
                        else if (now > end) status = 'ENDED';
                        else status = 'READY';
                    } else {
                        status = 'READY'; // Assume ready if no time limits
                    }

                    return {
                        id: exam.examId,
                        title: exam.title || 'Bài thi',
                        questionCount: exam.questionCount || 0,
                        level: exam.examLevel || 'Cơ bản',
                        duration: exam.durationMinutes ? `${exam.durationMinutes} phút` : 'Tự do',
                        startTime: exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN') : 'Tự do',
                        endTime: exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN') : 'Tự do',
                        status,
                    };
                });

                setHotExams(topExams);
            } catch (error) {
                console.error('Failed to fetch hot exams:', error);
            }
        };

        fetchHotExams();
    }, []);

    useEffect(() => {
        if (!user || typeof (user as any).id === 'undefined') return;

        const loadStats = async () => {
            try {
                const histories = await fetchApi(`/examHistory/student/${(user as any).id}`);
                if (Array.isArray(histories) && histories.length > 0) {
                    const examsDone = histories.length;
                    const totalScore = histories.reduce((sum: number, h: any) => sum + (h.score || 0), 0);
                    setCompletedExams(examsDone);
                    setAverageScore(parseFloat((totalScore / examsDone).toFixed(1)));
                } else {
                    setCompletedExams(0);
                    setAverageScore(0);
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        };
        loadStats();
    }, [user]);

    const handleJoinRoom = async () => {
        if (!roomCode.trim()) {
            toast.error("Vui lòng nhập mã phòng.");
            return;
        }

        setIsJoining(true);
        try {
            const code = roomCode.trim();
            const response = await fetchApi(`/online-exams/join/${code}`, { method: "POST" });
            if (response) {
                toast.success(`Tham gia phòng thành công!`);
                router.push(`/student/waiting-room/${code}`);
            }
        } catch (error: any) {
            toast.error(error.message || "Không thể tham gia phòng thi.");
        } finally {
            setIsJoining(false);
        }
    };

    const handleStartHotExam = (exam: HotExam) => {
        Swal.fire({
            title: 'Sẵn sàng làm bài?',
            text: `Bạn chuẩn bị bắt đầu bài thi "${exam.title}".`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d946ef', // fuchsia-500
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Bắt đầu làm',
            cancelButtonText: 'Để sau',
            borderRadius: '1rem'
        }).then((result) => {
            if (result.isConfirmed) {
                router.push(`/student/do-exam?examId=${exam.id}`);
            }
        });
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">

            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-2xl shadow-fuchsia-200">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-black/10 blur-3xl"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-md border border-white/20">
                            <SparklesIcon className="w-4 h-4" />
                            <span>Trải nghiệm học tập mới</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                            Chào, {displayName}! 👋
                        </h1>
                        <p className="text-violet-100 text-lg max-w-lg mx-auto md:mx-0">
                            Sẵn sàng chinh phục kiến thức hôm nay chưa? Nhập mã phòng để bắt đầu thi ngay.
                        </p>

                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex items-center p-2 max-w-md mx-auto md:mx-0 shadow-lg">
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                placeholder="Nhập mã phòng thi..."
                                className="flex-1 bg-transparent border-none text-white placeholder:text-violet-200 focus:ring-0 px-4 py-2"
                            />
                            <button
                                onClick={handleJoinRoom}
                                disabled={isJoining}
                                className="bg-white text-fuchsia-600 px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-fuchsia-50 transition-colors disabled:opacity-75"
                            >
                                {isJoining ? "Đang vào..." : "Vào thi"}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards within Hero */}
                    <div className="flex gap-4 md:gap-6">
                        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300 w-40 text-center border-b-4 border-violet-500">
                            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3 text-violet-600">
                                <CheckCircleIcon className="w-7 h-7" />
                            </div>
                            <div className="text-3xl font-black text-violet-700">{completedExams ?? '-'}</div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wide mt-1">Bài thi xong</div>
                        </div>
                        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300 w-40 text-center border-b-4 border-fuchsia-500">
                            <div className="w-12 h-12 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-3 text-fuchsia-600">
                                <TrophyIcon className="w-7 h-7" />
                            </div>
                            <div className="text-3xl font-black text-fuchsia-700">{averageScore ?? '-'}</div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wide mt-1">Điểm TB</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Hot Exams Section */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-500">
                        <FireIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-800">Bài thi nổi bật</h2>
                </div>

                {hotExams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-zinc-100 shadow-sm text-center">
                        <MagnifyingGlassIcon className="w-16 h-16 text-zinc-200 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-900">Không tìm thấy bài thi nào</h3>
                        <p className="text-zinc-500">Hãy thử quay lại sau nhé!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {hotExams.map((exam) => (
                            <div
                                key={exam.id}
                                className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-zinc-100 overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <ArrowRightIcon className="w-6 h-6 text-fuchsia-500 -rotate-45 group-hover:rotate-0 transition-transform" />
                                </div>

                                <div className="p-6 flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-xs font-bold text-zinc-600 uppercase tracking-wider">
                                            {exam.level}
                                        </span>
                                        {exam.status === 'READY' && (
                                            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-3 line-clamp-2 group-hover:text-fuchsia-600 transition-colors">
                                        {exam.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                                            <span>{exam.questionCount} câu</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <ClockIcon className="w-4 h-4 text-zinc-400" />
                                            <span>{exam.duration}</span>
                                        </div>
                                    </div>

                                    {/* Details that show on hover or always if relevant */}
                                    {exam.startTime !== 'Tự do' && (
                                        <div className="text-xs bg-zinc-50 p-2 rounded-lg text-zinc-500">
                                            Bắt đầu: {exam.startTime}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 group-hover:bg-fuchsia-50/50 transition-colors">
                                    <button
                                        onClick={() => handleStartHotExam(exam)}
                                        className="w-full py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-semibold text-sm shadow-sm group-hover:bg-fuchsia-600 group-hover:border-transparent group-hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <PlayCircleIcon className="w-5 h-5" />
                                        Vào thi ngay
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

// Helper Icon Component
function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
        </svg>
    );
}

export default StudentHomeContent;
