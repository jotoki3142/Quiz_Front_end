'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/user";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useUser();

  // Hide navbar on pages that render their own header to prevent duplicates
  const hideOnRoutes = [
    "/admin",
    "/register",
    "/student",
    "/teacher",
  ];
  if (pathname && hideOnRoutes.some((p) => pathname.startsWith(p))) return null;

  return (
    <header
      data-global="true"
      className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white shadow-sm"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/20">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-[#E33AEC]">
            QuizzZone
          </span>
        </Link>

        {/* Center nav removed as requested */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-3">
          {!isAuthenticated && (
            <>
              <Link
                href="/auth/login"
                className="hidden rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 sm:inline-block"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-zinc-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-500/30 active:scale-95 active:shadow-sm"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Đăng ký
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
