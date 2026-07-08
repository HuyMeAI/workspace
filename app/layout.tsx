'use client'; 

import { useState, useEffect } from 'react';
import './globals.css';
import { Sun, Moon } from 'lucide-react';

import Toast from './components/Toast';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import CreateTaskModal from './components/CreateTaskModal';
import FocusModeOverlay from './components/FocusModeOverlay';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' as 'error' | 'success' });

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type }), 3000);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <title>Huy Workspace</title>
        <meta name="description" content="Hệ thống quản lý công việc" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="icon" type="image/jpeg" href="https://workspace.tranduchuy.com/logo.jpg" />
        <link rel="shortcut icon" href="https://workspace.tranduchuy.com/logo.jpg" />
        <link rel="apple-touch-icon" href="https://workspace.tranduchuy.com/logo.jpg" />
      </head>

      <body className="bg-zinc-50 text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100 antialiased h-screen overflow-hidden flex transition-colors duration-500" suppressHydrationWarning>
        <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} />
        
        <Sidebar isDarkMode={isDarkMode} toggleTheme={toggleTheme} onOpenModal={() => setIsModalOpen(true)} onShowToast={showToast} />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* ĐẠI TU: THANH TOP BAR MOBILE CHUYÊN NGHIỆP (GIẢI QUYẾT LỖI ĐÈ NÚT) */}
          <div className="md:hidden flex items-center justify-between px-5 h-16 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 sticky top-0 z-40">
            <div className="font-extrabold text-xl tracking-tight">
              Workspace<span className="text-[#d97706] dark:text-[#f7bd00]">.</span>
            </div>
            <button onClick={toggleTheme} className="p-2 bg-zinc-100 dark:bg-white/10 rounded-full text-zinc-600 dark:text-zinc-300 active:scale-90 transition-transform">
              {isDarkMode ? <Sun size={18} className="text-[#f7bd00]" /> : <Moon size={18} />}
            </button>
          </div>

          <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
            {children}
          </main>
        </div>
        
        <BottomNav onOpenModal={() => setIsModalOpen(true)} />
        <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onShowToast={showToast} />
        <FocusModeOverlay />

      </body>
    </html>
  );
}