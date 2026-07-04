import { useState } from 'react';
import db from '../db/workspaceDB';
import { syncService } from '../services/syncService';
import { X, AlignLeft, Tag, Flag } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

const getTodayAt = (hours: number, minutes: number) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hr = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hr}:${min}`;
};

export default function CreateTaskModal({ isOpen, onClose, onShowToast }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('Flyday Media');
  const [priority, setPriority] = useState('urgent');
  const [startDatetime, setStartDatetime] = useState(getTodayAt(9, 0));
  const [endDatetime, setEndDatetime] = useState(getTodayAt(19, 0));

  const folders = useLiveQuery(() => db.folders.where('is_readonly').equals(0).toArray()) || [];

  const handleSaveTask = async () => {
    if (!title.trim()) {
      onShowToast('Vui lòng nhập tiêu đề công việc!', 'error');
      return;
    }
    try {
      await db.tasks.add({
        title: title.trim(),
        description: description.trim(),
        tag: tag,
        priority: priority,
        status: 'todo',
        start_datetime: startDatetime ? startDatetime : null,
        end_datetime: endDatetime ? endDatetime : null,
        tg_notified: 0,
        is_synced: 0
      });
      
      setTitle(''); setDescription(''); setTag('Flyday Media'); setPriority('urgent');
      setStartDatetime(getTodayAt(9, 0)); setEndDatetime(getTodayAt(19, 0));
      onClose();

      if (navigator.onLine) {
        syncService.pushToServer();
      }
    } catch (error) {
      onShowToast('Lỗi hệ thống khi lưu.', 'error');
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-zinc-900/40 dark:bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
      <div className={`fixed z-50 flex flex-col bg-white dark:bg-[#18181b] shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-2xl transition-all duration-300 ease-out bottom-0 left-0 right-0 w-full h-[85vh] rounded-t-3xl md:bottom-auto md:top-1/2 md:left-1/2 md:w-[550px] md:h-[80vh] md:max-h-[800px] md:rounded-2xl md:border border-zinc-200 dark:border-white/10 ${isOpen ? 'translate-y-0 md:-translate-x-1/2 md:-translate-y-1/2 md:scale-100 md:opacity-100' : 'translate-y-full md:-translate-x-1/2 md:-translate-y-[45%] md:scale-95 md:opacity-0 pointer-events-none'}`}>
        <div className="flex-none flex justify-between items-center p-5 border-b border-zinc-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#f7bd00] to-transparent opacity-80 dark:opacity-50"></div>
          <h3 className="font-extrabold text-lg tracking-wide text-zinc-900 dark:text-white">Tạo Task Mới</h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
          <div className="flex-none">
            <input type="text" placeholder="Tiêu đề công việc..." className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-zinc-300 dark:placeholder-zinc-600 text-zinc-900 dark:text-white focus:outline-none" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex items-start gap-4 flex-1 min-h-[100px]">
            <AlignLeft size={22} className="text-zinc-400 mt-1 flex-shrink-0" />
            <textarea placeholder="Thêm mô tả chi tiết (Tùy chọn)..." className="w-full h-full bg-transparent border-none focus:ring-0 p-0 text-base text-zinc-600 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none focus:outline-none" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>
          <div className="flex-none grid grid-cols-2 gap-4 sm:gap-5">
            <div className="p-4 bg-white dark:bg-black/50 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-500 mb-2 uppercase tracking-wider"><Tag size={14} /> Thư mục</div>
              <select className="w-full bg-transparent text-sm font-semibold border-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 cursor-pointer" value={tag} onChange={(e) => setTag(e.target.value)}>
              {folders.map(f => (
              <option key={f.id} value={f.name}>{f.name}</option>
              ))}
              </select>
            </div>
            <div className={`p-4 bg-white dark:bg-black/50 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none ${priority === 'urgent' ? 'text-red-600' : priority === 'high' ? 'text-[#d97706] dark:text-[#f7bd00]' : 'text-blue-500'}`}>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-500 mb-2 uppercase tracking-wider"><Flag size={14} className="text-zinc-400" /> Ưu tiên</div>
              <select className="w-full bg-transparent text-sm font-semibold border-none focus:ring-0 focus:outline-none p-0 cursor-pointer" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="urgent" className="text-red-600 font-bold">Urgent (Khẩn cấp)</option>
                <option value="high" className="text-[#d97706] font-bold">High (Cao)</option>
                <option value="medium" className="text-blue-500 font-bold">Medium (Vừa)</option>
              </select>
            </div>
          </div>
          <div className="flex-none p-4 bg-white dark:bg-black/50 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-500">Bắt đầu:</span>
              <input type="datetime-local" className="bg-transparent text-sm font-medium border-none focus:outline-none focus:ring-0 dark:text-white cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-70" value={startDatetime} onChange={(e) => setStartDatetime(e.target.value)} />
            </div>
            <div className="h-px bg-zinc-100 dark:bg-white/5"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-red-500">Deadline:</span>
              <input type="datetime-local" className="bg-transparent text-sm font-medium border-none focus:outline-none focus:ring-0 dark:text-white cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-70" value={endDatetime} onChange={(e) => setEndDatetime(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex-none p-5 border-t border-zinc-100 dark:border-white/5 rounded-b-2xl bg-zinc-50 dark:bg-transparent">
          <button onClick={handleSaveTask} className="w-full bg-gradient-to-r from-[#f7bd00] to-[#f59e0b] text-black py-4 rounded-xl font-extrabold text-base shadow-[0_4px_15px_rgba(247,189,0,0.3)] hover:shadow-[0_6px_20px_rgba(247,189,0,0.4)] transition-all active:scale-[0.98]">
            Lưu Công Việc
          </button>
        </div>
      </div>
    </>
  );
}