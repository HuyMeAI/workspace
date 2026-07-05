'use client';

import { useState, useEffect } from 'react';
import db from '@/app/db/workspaceDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Save, Trash2, Tag, Flag, AlignLeft, CheckCircle2 } from 'lucide-react';

export default function EditTaskModal({ isOpen, task, onClose }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  
  // STATE MỚI: Quản lý giao diện xác nhận xóa chuẩn UI
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const formatLocalDatetime = (dateStr: string) => {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setTag(task.tag || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'todo');
      setStartDatetime(formatLocalDatetime(task.start_datetime));
      setEndDatetime(formatLocalDatetime(task.end_datetime));
      setIsConfirmingDelete(false); // Reset trạng thái xóa khi mở task khác
    }
  }, [task]);

  const folders = useLiveQuery(() => db.folders.where('is_readonly').equals(0).toArray())?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (!title.trim()) return alert('Vui lòng nhập tên công việc');

    const updatedData = {
      title, description, tag, priority, status,
      start_datetime: startDatetime ? new Date(startDatetime).toISOString() : null,
      end_datetime: endDatetime ? new Date(endDatetime).toISOString() : null,
      updated_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`https://api.tranduchuy.com/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const serverTask = await res.json();
        await db.tasks.update(task.id, serverTask); 
      } else {
        await db.tasks.update(task.id, updatedData); 
      }
    } catch (error) {
      await db.tasks.update(task.id, updatedData); 
    }
    onClose();
  };

  const handleDelete = async () => {
    // Đã thay thế alert bằng hàm xóa trực tiếp (Vì đã được Confirm ở UI)
    try {
      await fetch(`https://api.tranduchuy.com/api/tasks/${task.id}`, { method: 'DELETE' });
    } catch(e) { console.log(e) }
    
    await db.tasks.delete(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white dark:bg-[#18181b] w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* HEADER: Đã thêm flex-shrink-0 để không bị bóp méo */}
        <div className="flex-shrink-0 p-5 sm:p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20">
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Sửa Task</h2>
          <button onClick={onClose} className="p-2 bg-zinc-200 dark:bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition"><X size={18}/></button>
        </div>

        {/* BODY: Bắt buộc co giãn và scroll */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
          <div>
            <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full text-2xl font-extrabold bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-0 px-0" placeholder="Tên công việc..."/>
          </div>

          <div>
            <div className="flex items-center gap-2 text-zinc-500 font-bold mb-2 text-sm"><AlignLeft size={16}/> Mô tả</div>
            <textarea 
              value={description} 
              onChange={e=>setDescription(e.target.value)} 
              className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#f7bd00] outline-none min-h-[80px] sm:min-h-[100px] resize-y" 
              placeholder="Thêm mô tả chi tiết..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 p-4 rounded-2xl">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-2"><Tag size={14}/> THƯ MỤC</label>
              <select value={tag} onChange={e=>setTag(e.target.value)} className="w-full bg-transparent text-sm font-semibold border-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer">
                {folders.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 p-4 rounded-2xl">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-2"><Flag size={14}/> ƯU TIÊN</label>
              <select value={priority} onChange={e=>setPriority(e.target.value)} className="w-full bg-transparent text-sm font-semibold border-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer">
                <option value="urgent" className="text-red-500">Khẩn cấp</option>
                <option value="high" className="text-orange-500">Cao</option>
                <option value="medium" className="text-blue-500">Vừa</option>
                <option value="low" className="text-zinc-500">Thấp</option>
              </select>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Bắt đầu:</label>
              <input type="datetime-local" value={startDatetime} onChange={e=>setStartDatetime(e.target.value)} className="bg-transparent text-sm font-bold text-zinc-900 dark:text-white outline-none"/>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/5 pt-4">
              <label className="text-sm font-bold text-red-500">Deadline:</label>
              <input type="datetime-local" value={endDatetime} onChange={e=>setEndDatetime(e.target.value)} className="bg-transparent text-sm font-bold text-zinc-900 dark:text-white outline-none"/>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-100 dark:border-white/5 p-4 rounded-2xl">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-2"><CheckCircle2 size={14}/> TRẠNG THÁI</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full bg-transparent text-sm font-semibold border-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer">
                <option value="todo">Cần làm</option>
                <option value="in_progress">Đang làm</option>
                <option value="done">Hoàn thành</option>
              </select>
          </div>
        </div>

        {/* FOOTER: Đã khóa flex-shrink-0 để luôn neo ở đáy */}
        {isConfirmingDelete ? (
          <div className="flex-shrink-0 p-4 sm:p-6 pb-8 sm:pb-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 flex flex-col gap-3">
            <p className="text-sm font-bold text-center text-zinc-700 dark:text-zinc-300">Bạn chắc chắn muốn xóa công việc này?</p>
            <div className="flex gap-3">
               <button onClick={() => setIsConfirmingDelete(false)} className="flex-1 p-3.5 bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-300 transition">Hủy</button>
               <button onClick={handleDelete} className="flex-1 p-3.5 bg-red-500 text-white rounded-xl font-bold shadow-md hover:bg-red-600 transition">Xác nhận xóa</button>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 p-4 sm:p-6 pb-8 sm:pb-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 flex gap-3">
            <button onClick={() => setIsConfirmingDelete(true)} className="p-3.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition"><Trash2 size={20}/></button>
            <button onClick={handleSave} className="flex-1 bg-[#f7bd00] text-black font-extrabold rounded-xl shadow-md hover:bg-[#e5ae00] transition flex items-center justify-center gap-2">
              <Save size={20}/> Lưu Thay Đổi
            </button>
          </div>
        )}

      </div>
    </div>
  );
}