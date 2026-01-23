"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError, toastSuccess } from "@/lib/toast";
import { QRCodeSVG } from "qrcode.react";
import { Play, Copy, Users, LogOut, Loader2, StopCircle, UserCheck, Smartphone, Hash, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

interface Participant {
    userId: number;
    displayName: string;
    avatarUrl: string;
}

interface ExamInfo {
    id: number;
    name: string;
    accessCode: string;
    status: string;
    maxParticipants: number;
    participants: number;
}

export default function AdminWaitingRoomPage() {
    const params = useParams();
    const router = useRouter();
    const accessCode = params.code as string;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<ExamInfo | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const stompClientRef = useRef<any>(null);

    // Fetch Exam Info
    useEffect(() => {
        if (!accessCode) return;

        const fetchInfo = async () => {
            try {
                setLoading(true);
                // Get exam info by access code
                const examData = await fetchApi(`/online-exams/info/${accessCode}`);
                setExam(examData);

                // Get current participants
                const participantsData = await fetchApi(`/waiting-room/${accessCode}/participants`);
                setParticipants(Array.isArray(participantsData) ? participantsData : []);
            } catch (error: any) {
                console.error("Failed to load waiting room:", error);
                toastError(error.message || "Không thể tải thông tin phòng chờ");
                router.push("/admin/list-exam");
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, [accessCode, router]);

    // WebSocket Connection
    useEffect(() => {
        if (!accessCode) return;

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8082/ws"),
            debug: function (str) {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = function (frame) {
            console.log("Connected: " + frame);
            client.subscribe(`/topic/waiting-room/${accessCode}`, (message) => {
                if (message.body) {
                    const notification = JSON.parse(message.body);
                    if (notification.participants) {
                        setParticipants(notification.participants);
                    }
                }
            });
        };

        client.onStompError = function (frame) {
            console.log('Broker reported error: ' + frame.headers['message']);
            console.log('Additional details: ' + frame.body);
        };

        client.activate();

        return () => {
            client.deactivate();
        };
    }, [accessCode]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toastSuccess("Đã sao chép!");
    };

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            'DRAFT': 'Nháp',
            'WAITING': 'Đang chờ',
            'IN_PROGRESS': 'Đang diễn ra',
            'FINISHED': 'Đã kết thúc'
        };
        return statusMap[status] || status;
    };

    const handleStartExam = async () => {
        if (!exam) return;

        try {
            await fetchApi(`/online-exams/${exam.id}/begin`, { method: "POST" });
            toastSuccess("Bắt đầu bài thi thành công!");
            router.push(`/admin/exam-online/${exam.id}/monitor`);
        } catch (error: any) {
            toastError(error.message || "Không thể bắt đầu bài thi");
        }
    };

    const handleFinishExam = async () => {
        if (!exam) return;

        const result = await Swal.fire({
            title: 'Kết thúc phòng chờ?',
            html: `Bạn có chắc muốn kết thúc phòng chờ cho bài thi <strong>"${exam.name}"</strong>?<br/>Bài thi sẽ chuyển về trạng thái Nháp.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Kết thúc',
            cancelButtonText: 'Hủy',
            background: '#1f2937',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            await fetchApi(`/online-exams/${exam.id}/finish`, { method: "POST" });
            toastSuccess("Đã kết thúc phòng chờ!");
            router.push("/admin/list-exam");
        } catch (error: any) {
            toastError(error.message || "Không thể kết thúc phòng chờ");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                        <Loader2 className="w-12 h-12 text-purple-500 animate-spin relative z-10" />
                    </div>
                    <span className="text-slate-400 font-medium animate-pulse">Đang tải phòng chờ...</span>
                </div>
            </div>
        );
    }

    if (!exam) return null;

    const joinUrl = `${window.location.origin}/student/join/${exam.accessCode}`;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
                    <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                {exam.name}
                            </h1>
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold border border-purple-500/20 backdrop-blur-sm">
                                {getStatusText(exam.status)}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                            <Smartphone size={14} /> Chế độ chờ người tham gia (Admin)
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleFinishExam}
                            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium group"
                        >
                            <StopCircle size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="hidden sm:inline">Kết thúc</span>
                        </button>
                        <button
                            onClick={() => router.push("/admin/list-exam")}
                            className="px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-white/10 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Thoát</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Join Info */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Smartphone className="text-purple-400" />
                                    Thông tin tham gia
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* QR Code */}
                                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner group-hover:shadow-purple-500/20 transition-all duration-500">
                                        <QRCodeSVG value={joinUrl} size={180} />
                                        <div className="mt-4 text-slate-900 font-bold text-sm bg-slate-100 px-4 py-1.5 rounded-full flex items-center gap-2">
                                            <Smartphone size={14} /> Quét mã để vào
                                        </div>
                                    </div>

                                    {/* Link & Code */}
                                    <div className="space-y-4 flex flex-col justify-center">
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors group/item">
                                            <div className="text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Mã Bài Thi</div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-4xl font-black text-white tracking-widest font-mono">
                                                    {exam.accessCode}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(exam.accessCode)}
                                                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-purple-400 group-hover/item:text-purple-300"
                                                    title="Sao chép mã"
                                                >
                                                    <Copy size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors group/item">
                                            <div className="text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Đường Dẫn Tham Gia</div>
                                            <div className="flex items-center justify-between gap-3">
                                                <code className="text-sm text-blue-400 truncate font-mono">
                                                    {joinUrl}
                                                </code>
                                                <button
                                                    onClick={() => handleCopy(joinUrl)}
                                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-blue-400 group-hover/item:text-blue-300"
                                                    title="Sao chép liên kết"
                                                >
                                                    <Copy size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Start Exam Action */}
                        <div className="bg-gradient-to-br from-purple-900/80 to-blue-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-white mb-2">Đã sẵn sàng?</h3>
                                <p className="text-purple-200 mb-6">
                                    Hiện có <strong className="text-white text-lg">{participants.length}</strong> học sinh đang chờ trong phòng.
                                </p>

                                <button
                                    onClick={handleStartExam}
                                    disabled={participants.length === 0}
                                    className={`
                                        group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold transition-all duration-300 rounded-2xl w-full sm:w-auto
                                        ${participants.length === 0
                                            ? 'bg-slate-700 text-white/50 cursor-not-allowed opacity-50'
                                            : 'bg-white text-purple-900 hover:scale-105 shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]'}
                                    `}
                                >
                                    {participants.length > 0 && (
                                        <div className="absolute inset-0 rounded-2xl ring-4 ring-white/20 group-hover:ring-white/40 transition-all animate-pulse" />
                                    )}
                                    <Play size={24} className={participants.length > 0 ? "fill-current" : ""} />
                                    <span>BẮT ĐẦU BÀI THI</span>
                                    {participants.length > 0 && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                                </button>

                                {participants.length === 0 && (
                                    <p className="mt-4 text-sm text-purple-300/60 animate-pulse">
                                        Vui lòng đợi ít nhất 1 học sinh tham gia...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Participants List */}
                    <div className="lg:col-span-5">
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col h-[600px] shadow-2xl relative overflow-hidden">
                            {/* Participants Header */}
                            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center backdrop-blur-sm sticky top-0 z-20">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Users className="text-blue-400" size={20} />
                                    Danh sách tham gia
                                </h3>
                                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                                    {participants.length} / {exam.maxParticipants}
                                </div>
                            </div>

                            {/* List Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar scroll-smooth">
                                {participants.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center relative">
                                            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-20" />
                                            <UserCheck size={32} className="opacity-50" />
                                        </div>
                                        <p className="font-medium">Chưa có ai tham gia</p>
                                        <p className="text-sm text-slate-600 text-center max-w-[200px]">
                                            Chia sẻ mã hoặc quét QR để mời học sinh tham gia
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {participants.map((p, index) => (
                                            <div
                                                key={p.userId}
                                                className="bg-slate-800/40 hover:bg-slate-700/50 p-3 rounded-xl flex items-center gap-4 border border-white/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hover:scale-[1.02] hover:shadow-lg group"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className="relative">
                                                    <img
                                                        src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.displayName)}&background=random`}
                                                        alt={p.displayName}
                                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-purple-500/50 transition-all"
                                                    />
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                                                        {p.displayName}
                                                    </h4>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
                                                        Đang chờ
                                                    </span>
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
