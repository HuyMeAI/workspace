'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from './db/workspaceDB'; 
import { syncService } from './services/syncService';
import ConfirmDialog from './components/ConfirmDialog';
import EditTaskModal from './components/EditTaskModal';
import Toast from './components/Toast';
import { LayoutList, KanbanSquare, Circle, CheckCircle2, Flag, Clock, Trash2, ArrowUpDown, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function Home() {
  // 1. STATE HIỂN THỊ & SẮP XẾP
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('default');
  
  // 2. STATE MẠNG & ĐỒNG BỘ
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // 3. STATE ĐIỀU PHỐI MODAL & TOAST
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' as 'success' | 'error' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, taskId: 0 });
  const [editModal, setEditModal] = useState({ isOpen: false, task: null as any });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type }), 3000);
  };

  // 4. LẤY DỮ LIỆU TỪ DEXIE VÀ SẮP XẾP
  const rawTasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const tasks = [...rawTasks]
    .filter((t: any) => t.tag !== 'Ngày lễ') 
    .sort((a: any, b: any) => {
      if (sortBy === 'deadline') {
        if (!a.end_datetime) return 1;
        if (!b.end_datetime) return -1;
        return new Date(a.end_datetime).getTime() - new Date(b.end_datetime).getTime();
      }
      if (sortBy === 'priority') {
        const weight: Record<string, number> = { urgent: 3, high: 2, medium: 1, default: 0 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      return b.id - a.id;
    });

  // 5. THEO DÕI MẠNG (ONLINE/OFFLINE)
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleSync = async () => {
      setIsSyncing(true);
      await syncService.pushToServer();
      await syncService.pullFromServer();
      setIsSyncing(false);
    };

    if (navigator.onLine) handleSync();

    const handleOnline = () => { setIsOnline(true); handleSync(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const manualSync = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    await syncService.pushToServer();
    await syncService.pullFromServer();
    setIsSyncing(false);
  };

  // 6. CÁC HÀM XỬ LÝ SỰ KIỆN (XÓA, SỬA, KÉO THẢ)
  const toggleTaskStatus = async (e: React.MouseEvent, id: number, currentStatus: string) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await db.tasks.update(id, { status: newStatus, is_synced: 0 });
    if (isOnline) syncService.pushToServer();
  };

  const requestDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setConfirmDialog({ isOpen: true, taskId: id });
  };

  const executeDelete = async () => {
    if (confirmDialog.taskId) {
      await db.tasks.delete(confirmDialog.taskId);
      setConfirmDialog({ isOpen: false, taskId: 0 });
      setEditModal({ isOpen: false, task: null });
      showToast('Đã xóa công việc thành công!');
      if (isOnline) syncService.pushToServer();
    }
  };

  const openEditModal = (task: any) => {
    setEditModal({ isOpen: true, task });
  };

  const handleDragStart = (e: React.DragEvent, id: number) => e.dataTransfer.setData('text/plain', id.toString());
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    const idStr = e.dataTransfer.getData('text/plain');
    if (idStr) {
      await db.tasks.update(Number(idStr), { status: targetStatus, is_synced: 0 });
      if (isOnline) syncService.pushToServer();
    }
  };

  // 7. CÁC HÀM TIỆN ÍCH (GIAO DIỆN)
  const today = new Date();
  const currentHour = today.getHours();
  let greetingPrefix = currentHour < 12 ? 'Chào buổi sáng,' : currentHour < 18 ? 'Buổi chiều vui vẻ nhé,' : 'Buổi tối thật "chill" nha,';
  const currentDateFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const getTimeStatus = (start: string | null, end: string | null, status: string) => {
    // 1. Xử lý các trạng thái đặc biệt
    if (status === 'done') return { text: 'Đã hoàn thành', className: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-transparent' };
    if (!end) return { text: 'Chưa xếp lịch', className: 'text-zinc-400 bg-zinc-100 dark:text-zinc-500 dark:bg-white/5 border-transparent' };
    
    // 2. Tính toán thời gian
    const diffMs = new Date(end).getTime() - new Date().getTime();
    const isOverdue = diffMs < 0;
    const absDiff = Math.abs(diffMs);
    
    const d = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const h = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((absDiff / 1000 / 60) % 60);
    
    // 3. Định dạng chuỗi Text (VD: 1 ngày 5 giờ, 2 giờ 30 phút...)
    let timeText = '';
    if (d > 0) timeText = `${d} ngày ${h > 0 ? h + ' giờ' : ''}`;
    else if (h > 0) timeText = `${h} giờ ${m} phút`;
    else timeText = `${m} phút`;
    
    // 4. Trả về kết quả kèm CSS (Màu đỏ nếu trễ, Màu vàng nếu hạn trong ngày, Màu xám nếu còn xa)
    if (isOverdue) {
      return { text: `Trễ ${timeText}`, className: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20' };
    }
    
    return { 
      text: `Còn ${timeText}`, 
      className: d === 0 ? 'text-[#d97706] bg-[#f7bd00]/15 border-[#f7bd00]/30 dark:text-[#f7bd00] dark:bg-[#f7bd00]/10 dark:border-[#f7bd00]/20' : 'text-zinc-500 bg-zinc-100 border-zinc-200 dark:text-zinc-400 dark:bg-white/5 dark:border-transparent' 
    };
  };

  const getTagStyle = (tag: string) => tag === 'Flyday Media' ? 'bg-[#f7bd00]/20 text-[#92400e] border-[#f7bd00]/30 dark:bg-[#f7bd00]/10 dark:text-[#f7bd00] dark:border-[#f7bd00]/20' : tag === 'Gia đình' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
  const getPriorityColor = (p: string) => p === 'urgent' ? 'text-red-500' : p === 'high' ? 'text-[#d97706] dark:text-[#f7bd00]' : 'text-blue-500';
  const getPriorityLabel = (p: string) => p === 'urgent' ? 'Ưu tiên: Khẩn cấp' : p === 'high' ? 'Ưu tiên: Cao' : p === 'medium' ? 'Ưu tiên: Vừa' : 'Không ưu tiên';

  const columns = [
    { id: 'todo', title: 'CẦN LÀM', dot: 'bg-zinc-300 dark:bg-zinc-500' },
    { id: 'in_progress', title: 'ĐANG LÀM', dot: 'bg-[#f7bd00] shadow-[0_0_8px_rgba(247,189,0,0.6)]' },
    { id: 'done', title: 'HOÀN THÀNH', dot: 'bg-green-500' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col relative">
      
      {/* CÁC COMPONENT TOAST & DIALOG TÁCH RỜI */}
      <Toast isOpen={toast.isOpen} message={toast.message} type={toast.type} />
      <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, taskId: 0 })} onConfirm={executeDelete} />
      
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f7bd00]/5 dark:bg-[#f7bd00]/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* HEADER DASHBOARD */}
      <div className="mb-8 flex-shrink-0 relative z-10">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {greetingPrefix} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d97706] to-[#b45309] dark:from-[#f7bd00] dark:to-[#f59e0b]">Huy!</span> 👋
          </h1>
          <button onClick={manualSync} disabled={!isOnline || isSyncing} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
            {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : isOnline ? <Cloud size={14} /> : <CloudOff size={14} />}
            <span className="hidden sm:inline">{isSyncing ? 'Đang đồng bộ...' : isOnline ? 'Đã đồng bộ' : 'Offline'}</span>
          </button>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 font-medium">Bạn có <span className="text-[#d97706] dark:text-[#f7bd00] font-bold">{tasks.filter((t:any) => t.status !== 'done').length} công việc</span> quan trọng hôm nay.</p>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold tracking-wide text-zinc-800 dark:text-zinc-100">{currentDateFormatted}</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-white dark:bg-black/50 px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm backdrop-blur-md">
              <ArrowUpDown size={16} className="text-zinc-400 flex-shrink-0" />
              <select className="w-full bg-transparent text-sm font-bold text-zinc-700 dark:text-zinc-300 border-none focus:ring-0 p-0 cursor-pointer outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="default" className="bg-white dark:bg-[#18181b]">Mới nhất</option>
                <option value="deadline" className="bg-white dark:bg-[#18181b]">Gần Deadline</option>
                <option value="priority" className="bg-white dark:bg-[#18181b]">Độ ưu tiên</option>
              </select>
            </div>
            <div className="flex bg-zinc-200/50 dark:bg-black/50 p-1.5 rounded-xl border border-zinc-200 dark:border-white/5 backdrop-blur-md flex-shrink-0">
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}><LayoutList size={18} /> <span className="hidden sm:inline">List</span></button>
              <button onClick={() => setViewMode('board')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'board' ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}><KanbanSquare size={18} /> <span className="hidden sm:inline">Board</span></button>
            </div>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-10 text-center">
          <p className="text-zinc-400 dark:text-zinc-600 font-bold text-lg mb-2">Chưa có công việc nào được tạo</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm max-w-sm">Hãy bấm nút "Tạo Task Mới" để bắt đầu.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden relative z-10">
          
          {/* VIEW DẠNG DANH SÁCH (LIST) */}
          {viewMode === 'list' && (
            <div className="space-y-3 overflow-y-auto h-full pb-20 custom-scrollbar pr-2">
              {tasks.map((task: any) => {
                const timeStatus = getTimeStatus(task.start_datetime, task.end_datetime, task.status);
                const isDone = task.status === 'done';
                const isInProgress = task.status === 'in_progress';
                
                return (
                  <div key={task.id} onClick={() => openEditModal(task)} className={`group/item flex items-start justify-between gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${isDone ? 'bg-zinc-50 dark:bg-white/[0.02] border-transparent opacity-60 shadow-none' : isInProgress ? 'bg-white dark:bg-[#18181b] border-[#f7bd00]/60 shadow-[0_4px_15px_rgba(247,189,0,0.12)] dark:shadow-[0_4px_20px_rgba(247,189,0,0.15)]' : 'bg-white dark:bg-[#18181b] border-zinc-200 dark:border-white/5 hover:border-[#f7bd00]/50 hover:shadow-md shadow-sm'}`}>
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <button onClick={(e) => toggleTaskStatus(e, task.id, task.status)} className="mt-0.5 flex-shrink-0 transition-colors">
                        {isDone ? <CheckCircle2 size={24} className="text-[#f7bd00]" /> : isInProgress ? <Circle size={24} className="text-[#f7bd00] fill-[#f7bd00]/20" /> : <Circle size={24} className="text-zinc-300 dark:text-zinc-600 hover:text-[#f7bd00]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-base truncate mb-2 transition-colors ${isDone ? 'text-zinc-400 dark:text-zinc-500 line-through' : isInProgress ? 'text-[#d97706] dark:text-[#f7bd00]' : 'text-zinc-800 dark:text-zinc-100 group-hover:text-[#d97706] dark:group-hover:text-[#f7bd00]'}`}>{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                          <span className={`px-2.5 py-1 rounded-md uppercase tracking-wider border ${getTagStyle(task.tag)}`}>{task.tag}</span>
                          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wide font-extrabold ${timeStatus.className}`}><Clock size={12} /> {timeStatus.text}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2 ml-2">
                      <button onClick={(e) => requestDelete(e, task.id)} className="opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 dark:hover:text-red-400 rounded-xl transition-all"><Trash2 size={18} /></button>
                      <div title={getPriorityLabel(task.priority)} className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-50 dark:bg-black/50 border border-zinc-100 dark:border-white/5 cursor-help">
                        <Flag size={16} className={`${getPriorityColor(task.priority)} ${isDone ? 'opacity-50' : ''}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW DẠNG BẢNG KÉO THẢ (BOARD) */}
          {viewMode === 'board' && (
            <div className="flex gap-6 overflow-x-auto h-full pb-6 snap-x custom-scrollbar">
              {columns.map(column => (
                <div key={column.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, column.id)} className="flex flex-col min-w-[280px] sm:min-w-[320px] lg:min-w-0 lg:flex-1 bg-zinc-100/70 dark:bg-black/40 rounded-3xl p-5 snap-center border border-zinc-200 dark:border-white/5 backdrop-blur-md">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${column.dot}`}></div>
                      <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 tracking-wider">{column.title}</h3>
                      <span className="bg-white dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-transparent">{tasks.filter((t: any) => t.status === column.id).length}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-[200px]">
                    {tasks.filter((t: any) => t.status === column.id).map((task: any) => {
                      const timeStatus = getTimeStatus(task.start_datetime, task.end_datetime, task.status);
                      return (
                        <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => openEditModal(task)} className={`group/card bg-white dark:bg-[#18181b] p-5 rounded-2xl cursor-grab transition-all duration-300 border shadow-sm active:cursor-grabbing ${task.status === 'in_progress' ? 'border-[#f7bd00]/50 shadow-[0_8px_24px_rgba(247,189,0,0.12)]' : 'border-zinc-200 dark:border-white/5 hover:border-[#f7bd00]/40'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${getTagStyle(task.tag)}`}>{task.tag}</span>
                            <div className="flex items-center gap-1.5">
                              <button onClick={(e) => requestDelete(e, task.id)} className="opacity-0 group-hover/card:opacity-100 p-1 text-zinc-400 hover:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400 rounded-md transition-all"><Trash2 size={14} /></button>
                              <div title={getPriorityLabel(task.priority)} className="cursor-help"><Flag size={15} className={`${getPriorityColor(task.priority)} ${task.status === 'done' ? 'opacity-50' : ''}`} /></div>
                            </div>
                          </div>
                          <h4 className={`font-bold text-sm mb-4 leading-snug ${task.status === 'done' ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-100'}`}>{task.title}</h4>
                          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wide font-extrabold ${timeStatus.className}`}><Clock size={12} /> {timeStatus.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPONENT MODAL SỬA ĐƯỢC TÁCH RỜI */}
      <EditTaskModal 
        isOpen={editModal.isOpen} 
        task={editModal.task} 
        onClose={() => setEditModal({ isOpen: false, task: null })} 
        onUpdateSuccess={() => { 
          setEditModal({ isOpen: false, task: null }); 
          showToast('Cập nhật thành công!'); 
          if (isOnline) syncService.pushToServer(); 
        }} 
        onDeleteRequest={(id: number) => {
           setEditModal({ isOpen: false, task: null }); // Đóng form sửa trước
           setConfirmDialog({ isOpen: true, taskId: id }); // Mở form xóa
        }} 
      />
    </div>
  );
}