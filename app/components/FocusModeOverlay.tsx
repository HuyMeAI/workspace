'use client';
import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/app/db/workspaceDB';
import { Square, Timer } from 'lucide-react';

export default function FocusModeOverlay() {
  const [totalSeconds, setTotalSeconds] = useState(0);
  
  // Truy vấn tìm task đang chạy
  const runningTasks = useLiveQuery(() => db.tasks.where('is_playing').equals(1).toArray()) || [];
  const activeTask = runningTasks[0]; // Lấy task đầu tiên đang chạy

  useEffect(() => {
    if (!activeTask) return;

    const calculateTotal = () => {
      let total = 0;
      const safeLogs = Array.isArray(activeTask.time_logs) ? activeTask.time_logs : [];
      safeLogs.forEach((log: any) => {
        if (!log || !log.start) return;
        const start = new Date(log.start).getTime();
        const end = log.end ? new Date(log.end).getTime() : new Date().getTime();
        total += Math.floor((end - start) / 1000);
      });
      setTotalSeconds(total);
    };

    calculateTotal();
    const interval = setInterval(() => setTotalSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [activeTask]);

  if (!activeTask) return null;

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const formattedTime = `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const handleStop = async () => {
    const now = new Date().toISOString();
    let logs = Array.isArray(activeTask.time_logs) ? [...activeTask.time_logs] : [];
    if (logs.length > 0) {
      let lastLog = logs[logs.length - 1];
      if (lastLog && !lastLog.end) lastLog.end = now;
    }
    
    // Cập nhật Dexie (Việc đẩy lên Server sẽ do hệ thống tự lo ở lần sync sau)
    await db.tasks.update(activeTask.id, { is_playing: 0, time_logs: logs });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="text-center max-w-xl px-6 flex flex-col items-center">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f7bd00]/20 text-[#f7bd00] border border-[#f7bd00]/30 font-bold uppercase tracking-widest text-xs mb-8">
          <Timer size={14} className="animate-pulse" /> Focus Mode
        </div>
        
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{activeTask.title}</h2>
        <p className="text-zinc-400 font-medium mb-12">{activeTask.tag}</p>

        <div className="text-7xl md:text-9xl font-black text-[#f7bd00] tracking-tighter mb-16 tabular-nums drop-shadow-[0_0_40px_rgba(247,189,0,0.3)]">
          {formattedTime}
        </div>

        <button 
          onClick={handleStop}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/10 hover:bg-red-500 hover:text-white text-zinc-300 font-bold text-lg transition-all duration-300 group"
        >
          <Square size={20} className="fill-current group-hover:scale-90 transition-transform" /> Dừng & Lưu
        </button>
      </div>
    </div>
  );
}