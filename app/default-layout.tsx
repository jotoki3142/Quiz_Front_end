// app/default-layout.tsx
import Link from "next/link";
import Footer from "@/components/Footer"; // Giả định đường dẫn

export default function DefaultLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen bg-slate-50 selection:bg-violet-500/30">
            {/* Global Background Effects for Public Pages */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-400/20 blur-[100px] opacity-50 mix-blend-multiply animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-400/20 blur-[100px] opacity-50 mix-blend-multiply animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 blur-[100px] opacity-50 mix-blend-multiply animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 w-full">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}

