'use client'; 

import { useState, useEffect } from 'react';
import './globals.css';

// Import các viên gạch Lego đã tách
import Toast from './components/Toast';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import CreateTaskModal from './components/CreateTaskModal';

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
      <body className="bg-zinc-50 text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100 antialiased h-screen overflow-hidden flex transition-colors duration-500" suppressHydrationWarning>
        
        {/* Render Toast Global */}
        <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} />

        {/* Render Thanh Menu Trái */}
        <Sidebar 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
          onOpenModal={() => setIsModalOpen(true)} 
          onShowToast={showToast} 
        />

        {/* Render Nội Dung Chính của Trang */}
        <main className="flex-1 h-full overflow-y-auto pb-24 md:pb-0 relative z-0">
          {children}
        </main>

        {/* Render Menu Đáy trên Mobile */}
        <BottomNav 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
          onOpenModal={() => setIsModalOpen(true)} 
          onShowToast={showToast} 
        />

        {/* Render Cửa sổ Tạo Task */}
        <CreateTaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onShowToast={showToast} 
        />

      </body>
    </html>
  );
}