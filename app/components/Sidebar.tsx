'use client';

import { Home, Folder, Plus, Calendar, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isDarkMode, toggleTheme, onOpenModal, onShowToast }: any) {
  const pathname = usePathname(); // Lấy URL hiện tại

  // Hàm tự động cấp class CSS dựa vào việc link có đang active hay không
  const getLinkStyle = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
      isActive
        ? 'bg-amber-50 dark:bg-[#f7bd00]/10 text-[#d97706] dark:text-[#f7bd00]' // Style khi đang ở trang đó
        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white' // Style mặc định
    }`;
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-[#09090b] z-10 transition-colors duration-500 relative shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#f7bd00]/15 dark:from-[#f7bd00]/10 to-transparent pointer-events-none"></div>
      <div className="p-6 font-extrabold text-2xl border-b border-zinc-100 dark:border-white/10 tracking-tight relative z-10">
        Workspace<span className="text-[#d97706] dark:text-[#f7bd00]">.</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto relative z-10">
        <Link href="/" className={getLinkStyle('/')}>
          <Home size={20} /> Trang chủ
        </Link>
        <Link href="/folders" className={getLinkStyle('/folders')}>
          <Folder size={20} /> Thư mục
        </Link>
        <Link href="/schedule" className={getLinkStyle('/schedule')}>
          <Calendar size={20} /> Lịch trình
        </Link>
        
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition font-medium mt-4 border border-zinc-200 dark:border-white/5">
          {isDarkMode ? <Sun size={20} className="text-[#f7bd00]" /> : <Moon size={20} className="text-zinc-600" />}
          {isDarkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}
        </button>
      </nav>

      <div className="p-4 border-t border-zinc-100 dark:border-white/10 relative z-10">
         <button onClick={onOpenModal} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f7bd00] to-[#f59e0b] text-black p-3.5 rounded-xl font-bold shadow-[0_4px_12px_rgba(247,189,0,0.3)] dark:shadow-[0_0_20px_rgba(247,189,0,0.3)] hover:shadow-[0_6px_16px_rgba(247,189,0,0.4)] dark:hover:shadow-[0_0_25px_rgba(247,189,0,0.5)] transition-all active:scale-95">
            <Plus size={20} strokeWidth={3} /> Tạo Task Mới
         </button>
      </div>
    </aside>
  );
}