"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { toastError } from "@/lib/toast";
import { Loader2, Users, Clock, AlertTriangle, Play } from "lucide-react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

interface ExamJoinInfo {
    examId: number;
    examName: string;
    status: string;
    roomName: string;
    participantCount: number;
}

export default function StudentWaitingRoomPage() {
    // ... (keep initial state hooks)
    const params = useParams();
    const router = useRouter();
    const accessCode = params.code as string;

    const [loading, setLoading] = useState(true);
    const [examInfo, setExamInfo] = useState<ExamJoinInfo | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const hasJoined = useRef(false);

    useEffect(() => {
        if (!accessCode) return;
        if (hasJoined.current) return;

        const loadExamInfo = async () => {
            try {
                hasJoined.current = true;
                setLoading(true);
                // Call join API (handles both joining and retrieving info)
                const response = await fetchApi(`/online-exams/join/${accessCode}`, { method: 'POST' });

                setExamInfo({
                    examId: response.examOnlineId,
                    examName: response.name,
                    status: response.status,
                    roomName: response.name,
                    participantCount: response.participantCount
                });

                setParticipants(response.participants || []);

            } catch (error: any) {
                console.error("Load error:", error);
                toastError(error.message || "Không thể tham gia phòng chờ");
                router.push("/student/studenthome");
            } finally {
                setLoading(false);
            }
        };

        loadExamInfo();
    }, [accessCode, router]);

    // WebSocket logic
    useEffect(() => {
        if (!accessCode || loading || !examInfo) return; // Wait until joined

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8082/ws"),
            debug: function (str) {
                // console.log(str); // Disabled debug logs
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = function (frame) {
            client.subscribe(`/topic/waiting-room/${accessCode}`, (message) => {
                if (message.body) {
                    const notification = JSON.parse(message.body);

                    // Check for START message
                    if (notification.message === "START") {
                        router.push(`/student/do-exam/${accessCode}`);
                        return;
                    }

                    if (notification.participants) {
                        setParticipants(notification.participants);
                    }
                }
            });
        };

        client.onStompError = function (frame) {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();

        return () => {
            client.deactivate();
        };
    }, [accessCode, loading, examInfo]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-purple-600 gap-4">
                <Loader2 className="animate-spin" size={48} />
                <h2 className="text-xl font-medium">Đang kết nối vào phòng chờ...</h2>
            </div>
        );
    }

    if (!examInfo) return null;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-purple-600 p-8 text-center text-white">
                    <h1 className="text-3xl font-bold mb-2">{examInfo.examName}</h1>
                    <p className="opacity-90">Mã phòng: <span className="font-mono font-bold tracking-widest">{accessCode}</span></p>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="flex flex-col items-center justify-center space-y-6">

                        <div className="bg-purple-50 text-purple-700 px-6 py-3 rounded-full flex items-center gap-3 font-semibold text-lg animate-pulse">
                            <Clock size={24} />
                            <span>Đang chờ giáo viên bắt đầu...</span>
                        </div>

                        <div className="w-full bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Users size={20} />
                                    Học sinh trong phòng
                                </h3>
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                                    {participants.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                                {participants.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded shadow-sm border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                            <img
                                                src={p.avatarUrl || `https://ui-avatars.com/api/?name=${p.displayName}&background=random`}
                                                alt={p.displayName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="text-sm truncate text-gray-700 font-medium">{p.displayName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-gray-500 text-sm text-center">
                            Vui lòng giữ màn hình này. Bài thi sẽ tự động bắt đầu khi giáo viên nhấn nút Start.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
