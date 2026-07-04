'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/workspaceDB';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Tag } from 'lucide-react';

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Lấy toàn bộ Task từ ổ cứng Dexie lên để hiển thị thời gian thực
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  // Mảng tên các thứ trong tuần
  const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Thuật toán tính toán số ngày của tháng và ô đệm trống chuẩn Google Calendar
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = () => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Quy đổi để Thứ 2 đứng đầu hàng
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Hàm filter lấy các task nằm trong một ngày cụ thể
  const getTasksForDay = (day: number) => {
    return tasks.filter((task: any) => {
      if (!task.start_datetime) return false;
      const taskDate = new Date(task.start_datetime);
      return taskDate.getDate() === day && taskDate.getMonth() === month && taskDate.getFullYear() === year;
    });
  };

  const getTagColor = (tag: string) => {
    if (tag === 'Flyday Media') return 'bg-[#f7bd00]/15 text-[#b45309] dark:text-[#f7bd00] border-[#f7bd00]/30';
    if (tag === 'Gia đình') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  };

  // Render các ô trống của tháng trước
  const blanks = Array(firstDayIndex()).fill(null);
  // Render các ô ngày của tháng hiện tại
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Gom tất cả vào một Grid Lịch duy nhất
  const calendarCells = [...blanks, ...days];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f7bd00]/5 dark:bg-[#f7bd00]/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* THANH ĐIỀU KHIỂN THÁNG/NĂM */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#f7bd00]/10 rounded-2xl flex items-center justify-center text-[#d97706] dark:text-[#f7bd00]">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase">
              Tháng {month + 1}, {year}
            </h1>
            <p className="text-sm text-zinc-500 font-medium">Xem lịch trình và tiến độ tổng quan</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-black/40 p-1.5 rounded-2xl border border-zinc-200 dark:border-white/5 backdrop-blur-md shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">
            Hôm nay
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* LƯỚI LỊCH (CALENDAR GRID) */}
      <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl border border-zinc-200 dark:border-white/5 shadow-xl flex flex-col overflow-hidden backdrop-blur-md">
        
        {/* THANH THỨ TRONG TUẦN */}
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 text-center py-3">
          {weekdays.map((day, idx) => (
            <span key={idx} className={`text-xs font-extrabold tracking-wider ${idx >= 5 ? 'text-amber-600 dark:text-[#f7bd00]' : 'text-zinc-400 dark:text-zinc-500'}`}>
              {day}
            </span>
          ))}
        </div>

        {/* Ô NGÀY CHI TIẾT */}
        <div className="grid grid-cols-7 flex-1 overflow-y-auto custom-scrollbar">
          {calendarCells.map((day, index) => {
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const dayTasks = day ? getTasksForDay(day) : [];

            return (
              <div key={index} className={`min-h-[100px] md:min-h-[130px] p-2 border-b border-r border-zinc-200 dark:border-white/5 flex flex-col gap-1 transition-all ${day ? 'bg-transparent' : 'bg-zinc-50/30 dark:bg-white/[0.01] opacity-40'} ${isToday ? 'bg-amber-50/20 dark:bg-[#f7bd00]/5' : ''}`}>
                
                {/* Số ngày */}
                {day && (
                  <div className="flex justify-end mb-1">
                    <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-md ${isToday ? 'bg-gradient-to-tr from-[#f7bd00] to-[#f59e0b] text-black shadow-md' : 'text-zinc-700 dark:text-zinc-400'}`}>
                      {day}
                    </span>
                  </div>
                )}

                {/* Danh sách Task thu nhỏ trong ngày */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                  {dayTasks.map((task: any) => (
                    <div key={task.id} className={`group px-2 py-1 rounded-lg border text-[11px] font-bold tracking-wide transition-all truncate hover:shadow-sm ${getTagColor(task.tag)} ${task.status === 'done' ? 'opacity-40 line-through' : ''}`} title={`${task.title} (${task.tag})`}>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-zinc-400' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-[#f7bd00]'}`}></div>
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}