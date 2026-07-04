'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/app/db/workspaceDB';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import EditTaskModal from '../components/EditTaskModal';

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const folders = useLiveQuery(() => db.folders.toArray()) || [];
  const filterableFolders = folders.sort((a,b)=>(a.order||0)-(b.order||0));

  const [deselectedFilters, setDeselectedFilters] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedDailyDate, setSelectedDailyDate] = useState<Date | null>(null);
  
  // STATE MỚI: Quản lý Toast thông báo
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  
  const weekdaysMobile = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weekdaysDesktop = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = () => { const day = new Date(year, month, 1).getDay(); return day === 0 ? 6 : day - 1; };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Tự động tắt Toast sau 3 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const getLunarDate = (date: Date) => {
    try {
      const lunarStr = new Intl.DateTimeFormat('vi-VN-u-ca-chinese', { day: 'numeric', month: 'numeric' }).format(date);
      const [lDay] = lunarStr.split('/');
      return lDay === '1' ? lunarStr : lDay;
    } catch (e) { return ''; }
  };

  const handleToggleFilter = (folderName: string) => {
    setDeselectedFilters(prev => prev.includes(folderName) ? prev.filter(f => f !== folderName) : [...prev, folderName]);
  };

  const getTasksForDay = (targetYear: number, targetMonth: number, day: number) => {
    const currentCellDate = new Date(targetYear, targetMonth, day).setHours(0, 0, 0, 0);
    return tasks.filter((task: any) => {
      if (deselectedFilters.includes(task.tag)) return false;
      if (!task.start_datetime) return false;
      const start = new Date(task.start_datetime).setHours(0, 0, 0, 0);
      const end = task.end_datetime ? new Date(task.end_datetime).setHours(0, 0, 0, 0) : start;
      return currentCellDate >= start && currentCellDate <= end;
    }).sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
  };

  const getTagColor = (tag: string) => {
    if (tag === 'Flyday Media') return 'bg-[#f7bd00]/15 text-[#b45309] dark:text-[#f7bd00] border-[#f7bd00]/30';
    if (tag === 'Gia đình') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (tag === 'Học Làm Phim') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (tag === 'Ngày lễ') return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 opacity-80';
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'; 
  };

  const TaskRow = ({ task }: { task: any }) => (
    <div 
      onClick={(e) => {
          e.stopPropagation(); 
          if(task.tag === 'Ngày lễ') {
              setToastMessage('Bạn không thể chỉnh sửa Ngày Lễ!');
              return;
          }
          setEditingTask(task);
      }} 
      className={`cursor-pointer px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-[4px] md:rounded-md border text-[10px] md:text-[12px] font-bold truncate transition-all w-full ${getTagColor(task.tag)} ${task.status === 'done' ? 'opacity-40 line-through' : 'hover:scale-[1.02] shadow-sm'}`}
      title={`${task.title} (${task.tag})`}
    >
      {task.title}
    </div>
  );

  return (
    <div className="p-3 md:p-6 lg:p-10 max-w-7xl mx-auto h-full flex flex-col relative overflow-hidden">
      
      {/* TOAST THÔNG BÁO XỊN SÒ */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm transition-all">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            {toastMessage}
            <button onClick={() => setToastMessage(null)} className="ml-2 opacity-70 hover:opacity-100"><X size={16}/></button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="hidden md:flex w-10 h-10 bg-[#f7bd00]/10 rounded-xl items-center justify-center text-[#d97706] dark:text-[#f7bd00]">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight capitalize">
              Tháng {month + 1}/{year}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-black/40 p-1 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <button onClick={prevMonth} className="p-1.5 md:p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition text-zinc-600 dark:text-zinc-400"><ChevronLeft size={20}/></button>
          <button onClick={nextMonth} className="p-1.5 md:p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition text-zinc-600 dark:text-zinc-400"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* THANH LỌC THƯ MỤC */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2 -mx-3 px-3 md:mx-0 md:px-0">
        {filterableFolders.map(f => (
          <label key={f.id} className="flex-shrink-0 flex items-center gap-2 cursor-pointer bg-white dark:bg-white/5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 transition">
            <input type="checkbox" checked={!deselectedFilters.includes(f.name)} onChange={() => handleToggleFilter(f.name)} className="w-4 h-4 rounded text-[#f7bd00] focus:ring-[#f7bd00] bg-zinc-100 border-zinc-300 dark:bg-black/50 dark:border-white/20"/>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{f.name}</span>
          </label>
        ))}
      </div>

      {/* GRID LỊCH */}
      <div className="flex-1 w-full bg-white dark:bg-[#121214] rounded-2xl md:rounded-3xl border border-zinc-200 dark:border-white/5 shadow-xl flex flex-col overflow-hidden">
        
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 text-center py-2 md:py-3 w-full">
          {weekdaysMobile.map((d, i) => <span key={'m'+i} className={`md:hidden text-[11px] font-extrabold tracking-wider ${i>=5?'text-amber-600 dark:text-[#f7bd00]':'text-zinc-400'}`}>{d}</span>)}
          {weekdaysDesktop.map((d, i) => <span key={'d'+i} className={`hidden md:block text-sm font-extrabold tracking-wider ${i>=5?'text-amber-600 dark:text-[#f7bd00]':'text-zinc-400'}`}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 w-full flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar content-start">
          {[...Array(firstDayIndex()).fill(null), ...Array.from({length: daysInMonth}, (_,i)=>i+1)].map((day, idx) => {
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            
            const dayTasks = day ? getTasksForDay(year, month, day) : [];
            const displayTasks = dayTasks.slice(0, 2);
            const overflowCount = dayTasks.length - 2;

            return (
              <div 
                key={idx} 
                onClick={() => day && setSelectedDailyDate(new Date(year, month, day))}
                // ĐÃ FIX LỖI ĐÈ TASK: Bổ sung 'overflow-hidden' vào ô cell để khóa cứng phần tử con
                className={`min-h-[100px] md:min-h-[140px] p-1 md:p-2 border-b border-r border-zinc-100 dark:border-white/5 flex flex-col gap-0.5 md:gap-1.5 cursor-pointer transition-colors overflow-hidden ${day?'hover:bg-zinc-50/50 dark:hover:bg-white/5':'bg-zinc-50/50 dark:bg-white/[0.02]'}`}
              >
                {day && (
                  <div className="flex flex-col items-center md:items-end md:flex-row md:justify-end gap-0.5 md:gap-1.5 mb-1 md:mb-2 opacity-90 hover:opacity-100">
                    <span className={`text-xs md:text-sm font-bold w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full ${isToday?'bg-[#f7bd00] text-black shadow-md':'text-zinc-600 dark:text-zinc-300'}`}>
                      {day}
                    </span>
                    <span className="text-[9px] md:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                      {getLunarDate(new Date(year, month, day))}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 flex flex-col gap-1 w-full overflow-hidden">
                  {displayTasks.map((task: any) => <TaskRow key={task.id} task={task} />)}
                  
                  {overflowCount > 0 && (
                    <div className="mt-auto text-[10px] md:text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white pt-1 px-1">
                      + {overflowCount} công việc
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* POPUP CHI TIẾT NGÀY (DAILY VIEW) */}
      {selectedDailyDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={() => setSelectedDailyDate(null)}>
          <div className="bg-white dark:bg-[#18181b] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative" onClick={e=>e.stopPropagation()}>
            
            <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20">
              <div>
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white capitalize">
                  {weekdaysDesktop[selectedDailyDate.getDay() === 0 ? 6 : selectedDailyDate.getDay() - 1]}
                </h2>
                <p className="text-sm text-zinc-500 font-medium mt-0.5">Ngày {selectedDailyDate.getDate()} tháng {selectedDailyDate.getMonth() + 1}, {selectedDailyDate.getFullYear()}</p>
              </div>
              <button onClick={() => setSelectedDailyDate(null)} className="p-2 bg-zinc-200 dark:bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition"><X size={18}/></button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3 pb-24 md:pb-5">
              {getTasksForDay(selectedDailyDate.getFullYear(), selectedDailyDate.getMonth(), selectedDailyDate.getDate()).map((task: any) => (
                <div key={task.id} className="flex gap-3 items-start group">
                  <div className="flex flex-col items-end w-12 pt-1 flex-shrink-0">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      {new Date(task.start_datetime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 mt-2.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <TaskRow task={task} />
                  </div>
                </div>
              ))}
              {getTasksForDay(selectedDailyDate.getFullYear(), selectedDailyDate.getMonth(), selectedDailyDate.getDate()).length === 0 && (
                <p className="text-center text-sm text-zinc-500 font-medium py-10">Không có công việc nào trong ngày này.</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* POPUP SỬA TASK */}
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