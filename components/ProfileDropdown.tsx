import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/lib/user";
import { logout } from "@/lib/utils";
import {
  UserCircleIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";

export default function ProfileDropdown() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const getProfileUrl = () => {
    switch (user?.role?.toUpperCase()) {
      case 'ADMIN': return '/admin/profile';
      case 'TEACHER': return '/teacher/profile';
      case 'STUDENT': return '/student/profile';
      default: return '/';
    }
  };

  const getChangePasswordUrl = () => {
    switch (user?.role?.toUpperCase()) {
      case 'ADMIN': return '/admin/change-password';
      case 'TEACHER': return '/teacher/change-password';
      case 'STUDENT': return '/student/change-password';
      default: return '/';
    }
  };

  const handleProfileClick = () => {
    setOpen(false);
    router.push(getProfileUrl());
  };

  const handleChangePasswordClick = () => {
    setOpen(false);
    router.push(getChangePasswordUrl());
  };

  const handleLogout = () => {
    setOpen(false);

    // @ts-ignore
    import("sweetalert2").then((Swal) => {
      Swal.default.fire({
        title: "Đăng xuất?",
        text: "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#7c3aed",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "Đăng xuất",
        cancelButtonText: "Hủy",
        background: "#fff",
        color: "#3f3f46",
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        },
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-4 py-2 font-medium',
          cancelButton: 'rounded-xl px-4 py-2 font-medium',
          title: 'text-xl font-bold text-zinc-900',
          htmlContainer: 'text-zinc-500'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          logout();
          toast.success("Đăng xuất thành công");
        }
      });
    });
  };

  if (!isAuthenticated) return null;

  const displayName = (() => {
    if (!user) return 'User';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;
    const rawUser = user.username || user.email || '';
    if (typeof rawUser === 'string' && rawUser.includes('@')) {
      return rawUser.split('@')[0];
    }
    return rawUser || 'User';
  })();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all duration-200 hover:bg-zinc-50 border border-transparent hover:border-zinc-200 group"
      >
        <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm group-hover:ring-violet-100 transition-all">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-start gap-0.5">
          <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
            {displayName}
          </span>
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
            {user?.role || 'User'}
          </span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-100/50 p-1.5 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">

          <div className="px-3 py-2 border-b border-dashed border-zinc-100 mb-1 sm:hidden">
            <p className="text-sm font-semibold text-zinc-800 truncate">{displayName}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>

          <button
            onClick={handleProfileClick}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-violet-50 hover:text-violet-700 transition-colors group"
          >
            <UserCircleIcon className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-violet-500 transition-colors" />
            Thông tin tài khoản
          </button>

          <button
            onClick={handleChangePasswordClick}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-violet-50 hover:text-violet-700 transition-colors group"
          >
            <KeyIcon className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-violet-500 transition-colors" />
            Đổi mật khẩu
          </button>

          <div className="h-px bg-zinc-100 my-1.5 mx-2" />

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors group"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-rose-400 group-hover:text-rose-600 transition-colors" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

