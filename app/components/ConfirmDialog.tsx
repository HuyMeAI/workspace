'use client';

import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm }: ConfirmDialogProps) {
  return (
    <div className={`fixed inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white dark:bg-[#18181b] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Xác nhận xóa</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition">
              Hủy
            </button>
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 dark:bg-red-800 dark:hover:bg-red-700 shadow-sm transition">
              Xóa ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}