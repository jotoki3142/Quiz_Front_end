// components/Footer.tsx
import React from 'react';
import { SparklesIcon } from "@heroicons/react/24/solid";

const Footer = () => {
  return (
    <footer className="w-full border-t border-zinc-100 bg-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <span className="text-xl font-black tracking-tighter text-[#E33AEC]">
                QuizzZone
              </span>
            </div>
            <p className="text-zinc-500 leading-relaxed max-w-sm">
              Nền tảng thi trắc nghiệm trực tuyến hàng đầu, giúp bạn nâng cao kiến thức và chinh phục mọi thử thách.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 mb-4">Kết nối với chúng tôi</h3>
            <div className="flex gap-4">
              {/* Facebook */}
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-all hover:bg-blue-600 hover:text-white hover:-translate-y-1">
                <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.742-2.971 2.28v1.692h4.43l-.742 3.667h-3.688v7.98h-4.844Z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-all hover:bg-pink-600 hover:text-white hover:-translate-y-1">
                <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 0 1 1.772 1.153 4.902 4.902 0 0 1 1.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 0 1-1.153 1.772 4.902 4.902 0 0 1-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 0 1-1.772-1.153 4.902 4.902 0 0 1-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 0 1 1.153-1.772A4.902 4.902 0 0 1 5.451 2.535c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 1.802a3.333 3.333 0 1 0 0 6.666 3.333 3.333 0 0 0 0-6.666zm5.338-3.205a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
                </svg>
              </a>
              {/* Twitter/X */}
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-all hover:bg-black hover:text-white hover:-translate-y-1">
                <svg fill="currentColor" viewBox="0 0 24 24" className="h-4 w-4">
                  <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 mb-4">Hỗ trợ</h3>
            <ul className="space-y-3 text-zinc-500">
              <li><a href="#" className="hover:text-violet-600 transition-colors">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-violet-600 transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-violet-600 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-violet-600 transition-colors">Liên hệ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-zinc-500">
            © 2025 QuizzZone. Mọi quyền được bảo lưu.
          </p>
          <div className="flex gap-6">
            {/* Social placeholders could go here */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;