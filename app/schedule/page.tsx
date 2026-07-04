'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/workspaceDB';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, MapPin, X } from 'lucide-react';

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // State quản lý Lọc & Popup
  const folders = useLiveQuery(() => db.folders.toArray()) || [];
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = () => { const day = new Date(year, month, 1).getDay(); return day === 0 ? 6 : day - 1; };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Toggle filter
  const handleToggleFilter = (folderName: string) => {
    setActiveFilters(prev => prev.includes(folderName) ? prev.filter(f => f !== folderName) : [...prev, folderName]);
  };

  const getTasksForDay = (day: number) => {
    const currentCellDate = new Date(year, month, day).setHours(0, 0, 0, 0);
    return tasks.filter((task: any) => {
      // 1. Áp dụng bộ lọc (Nếu mảng filter có đồ và task.tag không nằm trong mảng thì loại)
      if (activeFilters.length > 0 && !activeFilters.includes(task.tag)) return false;
      // 2. Lọc theo thời gian trải dài
      if (!task.start_datetime) return false;
      const start = new Date(task.start_datetime).setHours(0, 0, 0, 0);
      const end = task.end_datetime ? new Date(task.end_datetime).setHours(0, 0, 0, 0) : start;
      return currentCellDate >= start && currentCellDate <= end;
    });
  };

  const getStatusColor = (status: string) => {
    if (status === 'done') return 'bg-emerald-500 text-white';
    if (status === 'in_progress') return 'bg-blue-500 text-white';
    return 'bg-[#f7bd00] text-black';
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#f7bd00]/10 rounded-2xl flex items-center justify-center text-[#d97706] dark:text-[#f7bd00]"><CalendarIcon size={24} /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white uppercase">Tháng {month + 1}, {year}</h1>
            <p className="text-sm text-zinc-500 font-medium">Bấm vào Task để xem chi tiết</p>
          </div>
        </div>
        
        {/* DÀN CHECKBOX LỌC */}
        <div className="flex flex-wrap items-center gap-3">
          {folders.map(f => (
            <label key={f.id} className="flex items-center gap-2 cursor-pointer bg-white dark:bg-white/5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 transition">
              <input type="checkbox" checked={activeFilters.includes(f.name)} onChange={() => handleToggleFilter(f.name)} className="w-4 h-4 rounded text-[#f7bd00] focus:ring-[#f7bd00] bg-zinc-100 border-zinc-300 dark:bg-black/50 dark:border-white/20"/>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{f.name}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-black/40 p-1.5 rounded-2xl border border-zinc-200 dark:border-white/5 backdrop-blur-md shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition text-zinc-600 dark:text-zinc-400"><ChevronLeft size={20}/></button>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition text-zinc-600 dark:text-zinc-400"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl border border-zinc-200 dark:border-white/5 shadow-xl flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 text-center py-3">
          {weekdays.map((d, i) => <span key={i} className={`text-xs font-extrabold tracking-wider ${i>=5?'text-amber-600 dark:text-[#f7bd00]':'text-zinc-400'}`}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 flex-1 overflow-y-auto">
          {[...Array(firstDayIndex()).fill(null), ...Array.from({length: daysInMonth}, (_,i)=>i+1)].map((day, idx) => (
            <div key={idx} className={`min-h-[120px] p-2 border-b border-r border-zinc-100 dark:border-white/5 flex flex-col gap-1 ${day?'':'bg-zinc-50/30 dark:bg-white/[0.01]'}`}>
              {day && <div className="flex justify-end mb-1"><span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-md ${day===new Date().getDate()&&month===new Date().getMonth()?'bg-[#f7bd00] text-black':'text-zinc-500'}`}>{day}</span></div>}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {day && getTasksForDay(day).map((task: any) => (
                  <div key={task.id} onClick={()=>setSelectedTask(task)} className="cursor-pointer px-2 py-1 rounded border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate hover:bg-zinc-100 dark:hover:bg-white/10 transition">
                    <span className="opacity-70 mr-1">[{task.tag}]</span> {task.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POPUP CHI TIẾT TASK */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={()=>setSelectedTask(null)}>
          <div className="bg-white dark:bg-[#18181b] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 relative" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setSelectedTask(null)} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition"><X size={16}/></button>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 shadow-sm ${getStatusColor(selectedTask.status)}`}>
              {selectedTask.status === 'todo' ? 'CẦN LÀM' : selectedTask.status === 'in_progress' ? 'ĐANG LÀM' : 'HOÀN THÀNH'}
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-2">{selectedTask.title}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 bg-zinc-50 dark:bg-white/5 p-3 rounded-xl border border-zinc-100 dark:border-white/5">{selectedTask.description || 'Không có mô tả chi tiết'}</p>
            
            <div className="space-y-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-3"><MapPin size={16} className="text-zinc-400"/> Thư mục: <span className="text-[#f7bd00]">{selectedTask.tag}</span></div>
              <div className="flex items-center gap-3"><Clock size={16} className="text-zinc-400"/> Bắt đầu: {new Date(selectedTask.start_datetime).toLocaleString('vi-VN')}</div>
              {selectedTask.end_datetime && <div className="flex items-center gap-3 text-red-500"><Clock size={16}/> Kết thúc: {new Date(selectedTask.end_datetime).toLocaleString('vi-VN')}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}