import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Toast({ isOpen, message, type }: { isOpen: boolean, message: string, type: 'error' | 'success' }) {
  return (
    <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${type === 'error' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50' : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-[#f7bd00]/10 dark:text-[#f7bd00] dark:border-[#f7bd00]/20'}`}>
      {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
}