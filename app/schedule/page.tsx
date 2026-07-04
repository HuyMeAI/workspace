'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/app/db/workspaceDB';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import EditTaskModal from '../components/EditTaskModal';

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const folders = useLiveQuery(() => db.folders.toArray()) || [];
  // HIỂN THỊ CẢ NGÀY LỄ TRONG LỊCH
  const filterableFolders = folders.sort((a,b)=>(a.order||0)-(b.order||0));

  // THUẬT TOÁN MỚI: Mảng chứa các thư mục BỊ BỎ CHỌN (Mặc định mảng rỗng = Tất cả đều hiển thị)
  const [deselectedFilters, setDeselectedFilters] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<any>(null);

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  
  // Tách mảng Thứ cho Mobile và Desktop
  const weekdaysMobile = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weekdaysDesktop = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = () => { const day = new Date(year, month, 1).getDay(); return day === 0 ? 6 : day - 1; };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getLunarDate = (date: Date) => {
    try {
      const lunarStr = new Intl.DateTimeFormat('vi-VN-u-ca-chinese', { day: 'numeric', month: 'numeric' }).format(date);
      const [lDay, lMonth] = lunarStr.split('/');
      return lDay === '1' ? lunarStr : lDay;
    } catch (e) { return ''; }
  };

  const handleToggleFilter = (folderName: string) => {
    // Nếu có trong mảng bị bỏ chọn -> Xóa ra (Tức là chọn lại)
    // Nếu chưa có -> Thêm vào (Tức là bỏ chọn)
    setDeselectedFilters(prev => prev.includes(folderName) ? prev.filter(f => f !== folderName) : [...prev, folderName]);
  };

  const getTasksForDay = (day: number) => {
    const currentCellDate = new Date(year, month, day).setHours(0, 0, 0, 0);
    return tasks.filter((task: any) => {
      // 1. Áp dụng Lọc: Nếu Tag của Task nằm trong mảng "Bị bỏ chọn" thì ẩn
      if (deselectedFilters.includes(task.tag)) return false;
      
      // 2. Tính khoảng thời gian
      if (!task.start_datetime) return false;
      const start = new Date(task.start_datetime).setHours(0, 0, 0, 0);
      const end = task.end_datetime ? new Date(task.end_datetime).setHours(0, 0, 0, 0) : start;
      return currentCellDate >= start && currentCellDate <= end;
    });
  };

  const getTagColor = (tag: string) => {
    if (tag === 'Flyday Media') return 'bg-[#f7bd00]/15 text-[#b45309] dark:text-[#f7bd00] border-[#f7bd00]/30';
    if (tag === 'Gia đình') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (tag === 'Học Làm Phim') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (tag === 'Ngày lễ') return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 opacity-80';
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'; 
  };

  return (
    <div className="p-3 md:p-6 lg:p-10 max-w-7xl mx-auto h-full flex flex-col relative overflow-hidden">
      
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="hidden md:flex w-10 h-10 bg-[#f7bd00]/10 rounded-xl items-center justify-center text-[#d97706] dark:text-[#f7bd00]">
            <CalendarIcon size={20} />
          </div>
          <div>
            {/* Đã sửa Text: Tháng 7/2026 */}
            <h1 className="text-xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Tháng {month + 1}/{year}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-black/40 p-1 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <button onClick={prevMonth} className="p-1.5 md:p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition text-zinc-600 dark:text-zinc-400"><ChevronLeft size={20}/></button>
          <button onClick={nextMonth} className="p-1.5 md:p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition text-zinc-600 dark:text-zinc-400"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2 -mx-3 px-3 md:mx-0 md:px-0">
        {filterableFolders.map(f => (
          <label key={f.id} className="flex-shrink-0 flex items-center gap-2 cursor-pointer bg-white dark:bg-white/5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 transition">
            {/* Checked = KHÔNG nằm trong mảng bị bỏ chọn */}
            <input type="checkbox" checked={!deselectedFilters.includes(f.name)} onChange={() => handleToggleFilter(f.name)} className="w-3.5 h-3.5 rounded text-[#f7bd00] focus:ring-[#f7bd00] bg-zinc-100 border-zinc-300 dark:bg-black/50 dark:border-white/20"/>
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{f.name}</span>
          </label>
        ))}
      </div>

      <div className="flex-1 w-full bg-white dark:bg-[#121214] rounded-2xl md:rounded-3xl border border-zinc-200 dark:border-white/5 shadow-xl flex flex-col overflow-hidden">
        
        {/* RESPONSIVE THỨ TRONG TUẦN */}
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 text-center py-2 md:py-3 w-full">
          {weekdaysMobile.map((d, i) => <span key={'m'+i} className={`md:hidden text-[10px] font-extrabold tracking-wider ${i>=5?'text-amber-600 dark:text-[#f7bd00]':'text-zinc-400'}`}>{d}</span>)}
          {weekdaysDesktop.map((d, i) => <span key={'d'+i} className={`hidden md:block text-xs md:text-sm font-extrabold tracking-wider ${i>=5?'text-amber-600 dark:text-[#f7bd00]':'text-zinc-400'}`}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 w-full flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar content-start">
          {[...Array(firstDayIndex()).fill(null), ...Array.from({length: daysInMonth}, (_,i)=>i+1)].map((day, idx) => {
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            
            return (
              <div key={idx} className={`min-h-[90px] md:min-h-[140px] p-1 md:p-2 border-b border-r border-zinc-100 dark:border-white/5 flex flex-col gap-0.5 md:gap-1.5 ${day?'':'bg-zinc-50/50 dark:bg-white/[0.02]'}`}>
                
                {day && (
                  <div className="flex flex-col items-center md:items-end md:flex-row md:justify-end gap-0.5 md:gap-1.5 mb-1 md:mb-2 opacity-90 hover:opacity-100">
                    <span className={`text-[10px] md:text-sm font-bold w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday?'bg-[#f7bd00] text-black shadow-md':'text-zinc-600 dark:text-zinc-300'}`}>
                      {day}
                    </span>
                    <span className="text-[8px] md:text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      {getLunarDate(new Date(year, month, day))}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 flex flex-col gap-1 overflow-hidden w-full">
                  {day && getTasksForDay(day).map((task: any) => (
                    <div 
                      key={task.id} 
                      onClick={(e) => {
                          e.stopPropagation(); 
                          if(task.tag === 'Ngày lễ') return alert('Bạn không thể chỉnh sửa Ngày Lễ!');
                          setEditingTask(task);
                      }} 
                      // Phóng to Font Desktop, Bỏ Tag [Tên_thư_mục]
                      className={`cursor-pointer px-1 md:px-2.5 py-0.5 md:py-1.5 rounded-[4px] md:rounded-md border text-[9px] md:text-xs font-bold truncate transition-all w-full ${getTagColor(task.tag)} ${task.status === 'done' ? 'opacity-40 line-through' : 'hover:scale-[1.02] shadow-sm'}`}
                      title={`${task.title} (${task.tag})`}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {editingTask && (
        <EditTaskModal 
          isOpen={true} 
          task={editingTask} 
          onClose={() => setEditingTask(null)} 
        />
      )}
    </div>
  );
}