import { Home, Folder, Plus, Calendar, Sun, Moon } from 'lucide-react';

export default function BottomNav({ isDarkMode, toggleTheme, onOpenModal, onShowToast }: any) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 flex justify-around items-center h-16 pb-safe z-40 transition-colors duration-500 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-none">
       <a href="#" className="flex flex-col items-center p-2 text-[#d97706] dark:text-[#f7bd00]"><Home size={24} /></a>
       <a href="/folders" className="flex flex-col items-center p-2 text-[#d97706] dark:text-[#f7bd00]"><Folder size={24} /></a>
       <div className="relative -top-6">
          <button onClick={onOpenModal} className="bg-gradient-to-tr from-[#f7bd00] to-[#f59e0b] text-black p-4 rounded-full shadow-[0_6px_16px_rgba(247,189,0,0.4)] dark:shadow-[0_0_20px_rgba(247,189,0,0.4)] transition-all active:scale-90">
             <Plus size={28} strokeWidth={3} />
          </button>
       </div>
       <a href="/schedule" className="flex flex-col items-center p-2 text-zinc-400 dark:text-zinc-500"><Calendar size={24} /></a>
       <button onClick={toggleTheme} className="flex flex-col items-center p-2 text-zinc-400 dark:text-zinc-500 active:scale-90 transition-transform">
         {isDarkMode ? <Sun size={24} className="text-[#f7bd00]" /> : <Moon size={24} />}
       </button>
    </nav>
  );
}