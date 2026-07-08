'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/app/db/workspaceDB';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter, isBefore, parseISO, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { BarChart2, Calendar, Clock, PieChart as PieIcon, TrendingUp, TrendingDown, CheckSquare, X } from 'lucide-react';

export default function StatisticsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; title: string; tasks: any[] }>({
    isOpen: false, title: '', tasks: []
  });

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // THUẬT TOÁN XỬ LÝ DATA: TRỤC HOÀNH ĐỘNG & BIỂU ĐỒ XẾP CHỒNG
  const processData = () => {
    const now = new Date();
    let currStart = startOfWeek(now, { weekStartsOn: 1 });
    let prevStart = subWeeks(currStart, 1);

    if (timeRange === 'day') {
      currStart = startOfDay(now);
      prevStart = subDays(currStart, 1);
    }
    if (timeRange === 'month') {
      currStart = startOfMonth(now);
      prevStart = subMonths(currStart, 1);
    }
    if (timeRange === 'year') {
      currStart = startOfYear(now);
      prevStart = subYears(currStart, 1);
    }

    // 1. TẠO TRỤC HOÀNH ĐỘNG (Dynamic X-Axis Buckets)
    const barDataMap = new Map();
    if (timeRange === 'day') {
      for(let i=0; i<24; i++) barDataMap.set(`${i}h`, { name: `${i}h`, total: 0, tasksMap: {} });
    } else if (timeRange === 'week') {
      ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(d => barDataMap.set(d, { name: d, total: 0, tasksMap: {} }));
    } else if (timeRange === 'month') {
      [1, 2, 3, 4, 5].forEach(w => barDataMap.set(`Tuần ${w}`, { name: `Tuần ${w}`, total: 0, tasksMap: {} }));
    } else if (timeRange === 'year') {
      Array.from({length: 12}).forEach((_, i) => barDataMap.set(`Tháng ${i+1}`, { name: `Tháng ${i+1}`, total: 0, tasksMap: {} }));
    }

    const getBucket = (date: Date) => {
      if (timeRange === 'day') return `${date.getHours()}h`;
      if (timeRange === 'week') {
        const d = date.getDay();
        return d === 0 ? 'CN' : `T${d + 1}`;
      }
      if (timeRange === 'month') {
        const d = date.getDate();
        return `Tuần ${Math.ceil(d / 7)}`; // Chia tuần cho tháng
      }
      if (timeRange === 'year') {
        return `Tháng ${date.getMonth() + 1}`;
      }
      return '';
    };

    const tagDataMap: Record<string, { total: number; tasksMap: Record<number, { task: any; duration: number }> }> = {};
    const allTasksMap: Record<number, { task: any; duration: number }> = {};
    const uniqueTags = new Set<string>();
    
    let prevTotalMinutes = 0;

    tasks.forEach((task: any) => {
      const logs = Array.isArray(task.time_logs) ? task.time_logs : [];
      const currentTag = task.tag || 'Mặc định';
      
      logs.forEach((log: any) => {
        if (!log || !log.start) return;
        const startLogDate = parseISO(log.start);
        const endLogDate = log.end ? parseISO(log.end) : new Date();
        const durationMinutes = Math.max(0, Math.floor((endLogDate.getTime() - startLogDate.getTime()) / 1000)) / 60;

        if (durationMinutes <= 0) return;

        // Nếu thuộc KỲ HIỆN TẠI
        if (!isBefore(startLogDate, currStart)) {
          uniqueTags.add(currentTag);

          // Gom data Tổng Task
          if (!allTasksMap[task.id]) allTasksMap[task.id] = { task, duration: 0 };
          allTasksMap[task.id].duration += durationMinutes;

          // Gom data Biểu đồ Tròn
          if (!tagDataMap[currentTag]) tagDataMap[currentTag] = { total: 0, tasksMap: {} };
          tagDataMap[currentTag].total += durationMinutes;
          if (!tagDataMap[currentTag].tasksMap[task.id]) tagDataMap[currentTag].tasksMap[task.id] = { task, duration: 0 };
          tagDataMap[currentTag].tasksMap[task.id].duration += durationMinutes;

          // Gom data Biểu đồ Cột xếp chồng (Stacked Bar)
          const bucket = getBucket(startLogDate);
          const bData = barDataMap.get(bucket);
          if (bData) {
            bData[currentTag] = (bData[currentTag] || 0) + durationMinutes; 
            bData.total += durationMinutes; 
            if (!bData.tasksMap[task.id]) bData.tasksMap[task.id] = { task, duration: 0 };
            bData.tasksMap[task.id].duration += durationMinutes;
          }
        } 
        // Nếu thuộc KỲ TRƯỚC (Để so sánh %)
        else if (!isBefore(startLogDate, prevStart) && isBefore(startLogDate, currStart)) {
          prevTotalMinutes += durationMinutes;
        }
      });
    });

    const pieData = Object.keys(tagDataMap).map(tag => ({
      name: tag,
      value: Math.round(tagDataMap[tag].total * 10) / 10,
      tasks: Object.values(tagDataMap[tag].tasksMap).sort((a, b) => b.duration - a.duration)
    })).sort((a,b) => b.value - a.value);

    const barData = Array.from(barDataMap.values()).map(b => ({
      ...b,
      tasks: Object.values(b.tasksMap).sort((a: any, b: any) => b.duration - a.duration)
    }));

    const allProcessedTasks = Object.values(allTasksMap).sort((a, b) => b.duration - a.duration);
    const totalMinutes = pieData.reduce((sum, item) => sum + item.value, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const totalTasks = allProcessedTasks.length;

    // Tính toán Tăng trưởng so với kỳ trước
    let percentChange = 0;
    let isIncrease = true;
    if (prevTotalMinutes === 0) {
      percentChange = totalMinutes > 0 ? 100 : 0;
      isIncrease = true;
    } else {
      percentChange = ((totalMinutes - prevTotalMinutes) / prevTotalMinutes) * 100;
      isIncrease = percentChange >= 0;
    }

    return { 
      pieData, 
      barData, 
      totalHours, 
      totalTasks, 
      allProcessedTasks,
      uniqueTags: Array.from(uniqueTags),
      comparison: { percent: Math.abs(percentChange).toFixed(1), isIncrease }
    };
  };

  const { pieData, barData, totalHours, totalTasks, allProcessedTasks, uniqueTags, comparison } = processData();
  const BASE_COLORS = ['#f7bd00', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#84cc16'];

  const handleOpenDetail = (title: string, taskList: any[]) => {
    setDetailModal({ isOpen: true, title, tasks: taskList });
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    if (h > 0 && m > 0) return `${h}h ${m}p`;
    if (h > 0) return `${h}h`;
    return `${m}p`;
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-full pb-28 md:pb-10 relative">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#f7bd00]/5 dark:bg-[#f7bd00]/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* HEADER ĐÃ ĐƯỢC TỐI ƯU CÂU CHỮ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f7bd00]/10 rounded-xl flex items-center justify-center text-[#d97706] dark:text-[#f7bd00]">
            <BarChart2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Thống Kê</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Báo cáo chi tiết xử lý công việc theo thời gian</p>
          </div>
        </div>

        <div className="flex bg-zinc-200/50 dark:bg-black/50 p-1 rounded-xl border border-zinc-200 dark:border-white/5 backdrop-blur-md w-full sm:w-auto overflow-x-auto custom-scrollbar">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${timeRange === range ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              {range === 'day' ? 'Hôm nay' : range === 'week' ? 'Tuần này' : range === 'month' ? 'Tháng này' : 'Năm nay'}
            </button>
          ))}
        </div>
      </div>

      {/* 3 THẺ TỔNG QUAN */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-8">
        <div 
          onClick={() => handleOpenDetail('Tất cả công việc đã xử lý', allProcessedTasks)}
          className="cursor-pointer col-span-2 lg:col-span-1 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-blue-500/50 hover:shadow-md transition-all group"
        >
          <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform"><CheckSquare size={26}/></div>
          <div>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Đã xử lý</p>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-0.5 tabular-nums">{totalTasks} <span className="text-sm font-bold text-zinc-500">Task</span></h3>
          </div>
        </div>

        <div 
          onClick={() => handleOpenDetail('Chi tiết tổng thời gian', allProcessedTasks)}
          className="cursor-pointer bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-[#f7bd00]/50 hover:shadow-md transition-all group"
        >
          <div className="p-3.5 bg-[#f7bd00]/10 text-[#d97706] dark:text-[#f7bd00] rounded-xl group-hover:scale-110 transition-transform"><Clock size={26}/></div>
          <div>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Thời gian</p>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-0.5 tabular-nums">{totalHours} <span className="text-sm font-bold text-zinc-500">Giờ</span></h3>
          </div>
        </div>

        {/* THẺ SO SÁNH VỚI KỲ TRƯỚC */}
        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-[#f7bd00]/30 transition-colors overflow-hidden">
          <div className={`p-3.5 rounded-xl flex-shrink-0 ${comparison.isIncrease ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {comparison.isIncrease ? <TrendingUp size={26}/> : <TrendingDown size={26}/>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate">So với kỳ trước</p>
            <h3 className={`text-lg font-extrabold mt-1.5 truncate ${comparison.isIncrease ? 'text-emerald-500' : 'text-red-500'}`}>
              {comparison.isIncrease ? '+' : '-'}{comparison.percent}%
            </h3>
          </div>
        </div>
      </div>

      {/* 2 BIỂU ĐỒ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* BIỂU ĐỒ CỘT XẾP CHỒNG (STACKED BAR) */}
        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm lg:col-span-7 flex flex-col h-[350px] md:h-[400px]">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-6 flex items-center gap-2"><Calendar size={18} className="text-zinc-400"/> Biểu đồ thời gian làm việc</h3>
          <div className="flex-1 w-full text-xs font-bold">
            {totalHours === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 font-medium border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Chưa có dữ liệu phiên làm việc</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip cursor={{ fill: 'rgba(128,128,128,0.05)' }} contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{ fontWeight: 'bold' }} />
                  
                  {/* TẠO CÁC LỚP XẾP CHỒNG DỰA TRÊN DANH SÁCH THƯ MỤC CÓ THỰC */}
                  {uniqueTags.map((tag, idx) => (
                    <Bar 
                      key={tag}
                      dataKey={tag} 
                      stackId="a" // Điểm mấu chốt để tạo Stacked Bar
                      fill={BASE_COLORS[idx % BASE_COLORS.length]} 
                      maxBarSize={40} 
                      style={{ cursor: 'pointer' }}
                      onClick={(data: any) => {
                        const payload = data?.payload || data;
                        if (payload && payload.tasks && payload.tasks.length > 0) {
                          handleOpenDetail(`Lịch sử: ${payload.name}`, payload.tasks);
                        }
                      }}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* BIỂU ĐỒ TRÒN TỶ LỆ */}
        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm lg:col-span-5 flex flex-col h-[350px] md:h-[400px]">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2"><PieIcon size={18} className="text-zinc-400"/> Phân bổ thời gian (%)</h3>
          <div className="flex-1 w-full text-xs font-bold relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-400 font-medium border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius={70} 
                    outerRadius={100} 
                    paddingAngle={4} 
                    dataKey="value" 
                    stroke="none"
                    style={{ cursor: 'pointer' }}
                    onClick={(data: any) => {
                      const payload = data?.payload || data;
                      if (payload && payload.tasks) handleOpenDetail(`Thư mục: ${payload.name}`, payload.tasks);
                    }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BASE_COLORS[index % BASE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} phút`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '16px', color: '#71717a' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* POPUP HIỂN THỊ DANH SÁCH CHI TIẾT TASK - ĐÃ XÓA DÒNG SUBTITLE THÔ KỆCH */}
      {detailModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setDetailModal({ ...detailModal, isOpen: false })}>
          <div className="bg-white dark:bg-[#18181b] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20">
              <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{detailModal.title}</h2>
              <button onClick={() => setDetailModal({ ...detailModal, isOpen: false })} className="p-2 bg-zinc-200 dark:bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition"><X size={18} /></button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 bg-zinc-50/30 dark:bg-transparent">
              {detailModal.tasks.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 sm:p-4 bg-white dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm hover:border-[#f7bd00]/30 transition-colors">
                  <div className="flex flex-col min-w-0 pr-4 flex-1">
                    <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate mb-1.5">{item.task.title}</span>
                    <span className="w-fit text-[9px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase px-2 py-0.5 rounded border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/20">{item.task.tag}</span>
                  </div>
                  <div className="flex-shrink-0 font-black text-[#d97706] dark:text-[#f7bd00] bg-[#f7bd00]/10 border border-[#f7bd00]/20 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-inner">
                    <Clock size={12}/> {formatDuration(item.duration)}
                  </div>
                </div>
              ))}
              {detailModal.tasks.length === 0 && (
                <div className="text-center text-zinc-400 font-medium py-10">Không có dữ liệu chi tiết.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}