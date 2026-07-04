'use client';

import { useState, useEffect } from 'react';
import db from '../db/workspaceDB';
import { X, AlignLeft, Tag, Flag, Trash2 } from 'lucide-react';

export default function EditTaskModal({ isOpen, task, onClose, onUpdateSuccess, onDeleteRequest }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [priority, setPriority] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');

  // Tự động đổ dữ liệu cũ của Task vào Form mỗi khi mở Modal
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setTag(task.tag);
      setPriority(task.priority);
      setStartDatetime(task.start_datetime || '');
      setEndDatetime(task.end_datetime || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleUpdate = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề!');
      return;
    }
    await db.tasks.update(task.id, {
      title: title.trim(),
      description: description.trim(),
      tag: tag,
      priority: priority,
      start_datetime: startDatetime ? startDatetime : null,
      end_datetime: endDatetime ? endDatetime : null,
      is_synced: 0
    });
    onUpdateSuccess();
  };

  return (
    <>
      <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 opacity-100 pointer-events-auto" onClick={onClose}></div>
      <div className="fixed z-50 flex flex-col bg-white dark:bg-[#18181b] shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-2xl transition-all duration-300 ease-out bottom-0 left-0 right-0 w-full h-[85vh] rounded-t-3xl md:bottom-auto md:top-1/2 md:left-1/2 md:w-[550px] md:h-[80vh] md:max-h-[800px] md:rounded-2xl md:border border-zinc-200 dark:border-white/10 translate-y-0 md:-translate-x-1/2 md:-translate-y-1/2 md:scale-100 md:opacity-100">
        <div className="flex-none flex justify-between items-center p-5 border-b border-zinc-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#f7bd00] to-transparent opacity-80 dark:opacity-50"></div>
          <h3 className="font-extrabold text-lg tracking-wide text-zinc-900 dark:text-white">Sửa Task</h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
          <div className="flex-none">
            <input type="text" className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-zinc-300 dark:placeholder-zinc-600 text-zinc-900 dark:text-white focus:outline-none" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex items-start gap-4 flex-1 min-h-[100px]">
            <AlignLeft size={22} className="text-zinc-400 mt-1 flex-shrink-0" />
            <textarea className="w-full h-full bg-transparent border-none focus:ring-0 p-0 text-base text-zinc-600 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none focus:outline-none" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>

          <div className="flex-none grid grid-cols-2 gap-4 sm:gap-5">
            <div className="p-4 bg-white dark:bg-black/50 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider"><Tag size={14} /> Thư mục</div>
              <select className="w-full bg-transparent text-sm font-semibold border-none focus:ring-0 focus:outline-none p-0 text-zinc-800 dark:text-zinc-200 cursor-pointer" value={tag} onChange={(e) => setTag(e.target.value)}>
                <option value="Flyday Media">Flyday Media</option>
                <option value="Cá nhân">Cá nhân</option>
                <option value="Gia đình">Gia đình</option>
              </select>
            </div>
            <div className={`p-4 bg-white dark:bg-black/50 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none ${priority === 'urgent' ? 'text-red-600 dark:text-red-500' : priority === 'high' ? 'text-[#d97706] dark:text-[#f7bd00]' : 'text-blue-500'}`}>
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

        <div className="flex-none flex gap-3 p-5 border-t border-zinc-100 dark:border-white/5 rounded-b-2xl bg-zinc-50 dark:bg-transparent">
          <button onClick={() => onDeleteRequest(task.id)} className="w-14 flex items-center justify-center bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><Trash2 size={20} /></button>
          <button onClick={handleUpdate} className="flex-1 bg-gradient-to-r from-[#f7bd00] to-[#f59e0b] text-black py-3.5 rounded-xl font-extrabold text-base shadow-[0_4px_15px_rgba(247,189,0,0.3)] hover:shadow-[0_6px_20px_rgba(247,189,0,0.4)] transition-all active:scale-[0.98]">Lưu Thay Đổi</button>
        </div>
      </div>
    </>
  );
}