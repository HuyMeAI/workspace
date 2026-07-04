'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/workspaceDB';
import { Folder, Settings, Plus, Trash2, Info, X, CheckCircle2 } from 'lucide-react';

export default function FoldersPage() {
  const [activeFolder, setActiveFolder] = useState<string>('Tất cả');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const folders = useLiveQuery(() => db.folders.toArray()) || [];
  const editableFolders = folders.filter(f => !f.is_readonly);
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const filteredTasks = activeFolder === 'Tất cả' ? tasks : tasks.filter(t => t.tag === activeFolder);

  // Thêm Thư mục mới
  const handleAddFolder = async () => {
    const name = prompt('Tên thư mục mới:');
    if (!name) return;
    const calendar_id = prompt('ID Google Calendar (Bỏ trống nếu chưa có):');
    await db.folders.add({ name, calendar_id: calendar_id || '', is_readonly: 0 });
  };

  const handleEditFolder = async (id: number, currentName: string, currentId: string) => {
    const newName = prompt('Sửa tên:', currentName) || currentName;
    const newId = prompt('Sửa ID Lịch:', currentId) || currentId;
    await db.folders.update(id, { name: newName, calendar_id: newId });
    // Update luôn tên tag trong các task cũ
    const tasksToUpdate = await db.tasks.where('tag').equals(currentName).toArray();
    for (const t of tasksToUpdate) {
      await db.tasks.update(t.id, { tag: newName });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-end mb-8 border-b border-zinc-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-3">
            <Folder className="text-[#f7bd00]" size={32} /> Quản lý Thư mục
          </h1>
          <p className="text-zinc-500 mt-2">Phân loại công việc đồng bộ theo Google Calendar</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 transition">
          <Settings size={22} className="text-zinc-600 dark:text-zinc-300" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
        {/* CỘT TRÁI: DANH SÁCH PILLS */}
        <div className="w-full md:w-64 flex flex-col gap-2 overflow-y-auto no-scrollbar">
          <button onClick={() => setActiveFolder('Tất cả')} className={`text-left px-5 py-3.5 rounded-2xl font-bold transition-all ${activeFolder === 'Tất cả' ? 'bg-[#f7bd00] text-black shadow-md' : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}>Tất cả công việc</button>
          {folders.map(f => (
            <button key={f.id} onClick={() => setActiveFolder(f.name)} className={`text-left px-5 py-3.5 rounded-2xl font-bold transition-all ${activeFolder === f.name ? 'bg-[#f7bd00] text-black shadow-md' : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}>
              {f.name} <span className="text-xs ml-2 opacity-60">({tasks.filter(t => t.tag === f.name).length})</span>
            </button>
          ))}
        </div>

        {/* CỘT PHẢI: HIỂN THỊ TASK */}
        <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl border border-zinc-200 dark:border-white/5 p-6 overflow-y-auto custom-scrollbar shadow-sm">
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" /> Công việc thuộc: <span className="text-[#f7bd00]">{activeFolder}</span>
          </h2>
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <div key={task.id} className="p-4 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 flex justify-between items-center">
                <span className={`font-bold ${task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>{task.title}</span>
                <span className="text-xs px-2.5 py-1 bg-white dark:bg-white/10 rounded-md border font-bold">{task.priority}</span>
              </div>
            ))}
            {filteredTasks.length === 0 && <p className="text-zinc-500 text-sm font-medium">Chưa có công việc nào trong thư mục này.</p>}
          </div>
        </div>
      </div>

      {/* MODAL CÀI ĐẶT THƯ MỤC & GOOGLE CALENDAR ID */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#18181b] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-black/20">
              <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="text-[#f7bd00]"/> Quản lý ID Lịch Google</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-zinc-200 dark:bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition"><X size={18}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300 font-medium">
                <Info className="flex-shrink-0 mt-0.5"/>
                <p>Để lấy ID: Vào Google Calendar (PC) {'>'} Cài đặt lịch {'>'} Tích hợp lịch {'>'} Copy <b>Mã lịch</b>. <br/><i>(Lưu ý: Mọi ID thay đổi ở đây cần báo cho Backend Laravel cấu hình lại để đồng bộ 2 chiều chính xác)</i>.</p>
              </div>
              
              {editableFolders.map(f => (
                <div key={f.id} className="p-4 border border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-between bg-zinc-50 dark:bg-black/10">
                  <div className="flex-1 overflow-hidden pr-4">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">{f.name}</h3>
                    <p className="text-xs text-zinc-500 truncate mt-1">ID: {f.calendar_id || 'Chưa liên kết'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditFolder(f.id, f.name, f.calendar_id)} className="px-4 py-2 bg-zinc-200 dark:bg-white/10 rounded-xl text-sm font-bold hover:bg-[#f7bd00] hover:text-black transition">Sửa</button>
                    <button onClick={() => { if(confirm('Chắc chắn xóa? Các task cũ vẫn giữ tag này.')) db.folders.delete(f.id) }} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
              <button onClick={handleAddFolder} className="w-full py-3.5 bg-gradient-to-r from-[#f7bd00] to-[#f59e0b] text-black font-bold rounded-2xl shadow-md flex justify-center items-center gap-2"><Plus/> Thêm Thư mục đồng bộ mới</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}