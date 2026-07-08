'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/app/db/workspaceDB';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter, parseISO } from 'date-fns';
import { BarChart2, Calendar, Clock, PieChart as PieIcon, TrendingUp, CheckSquare } from 'lucide-react';

export default function StatisticsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const processData = () => {
    const now = new Date();
    let filterDate = startOfWeek(now, { weekStartsOn: 1 });

    if (timeRange === 'day') filterDate = startOfDay(now);
    if (timeRange === 'month') filterDate = startOfMonth(now);
    if (timeRange === 'year') filterDate = startOfYear(now);

    const tagTotals: Record<string, number> = {};
    const dailyTotals: Record<string, number> = {};
    const processedTaskIds = new Set(); // Dùng Set để đếm số task duy nhất

    tasks.forEach((task: any) => {
      const logs = Array.isArray(task.time_logs) ? task.time_logs : [];
      
      logs.forEach((log: any) => {
        if (!log || !log.start) return;
        const startLogDate = parseISO(log.start);

        if (isAfter(startLogDate, filterDate)) {
          processedTaskIds.add(task.id); // Đếm task này vào danh sách đã làm

          const endLogDate = log.end ? parseISO(log.end) : new Date();
          const durationSeconds = Math.max(0, Math.floor((endLogDate.getTime() - startLogDate.getTime()) / 1000));
          const durationMinutes = durationSeconds / 60;

          const currentTag = task.tag || 'Mặc định';
          tagTotals[currentTag] = (tagTotals[currentTag] || 0) + durationMinutes;

          const dayName = startLogDate.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' });
          dailyTotals[dayName] = (dailyTotals[dayName] || 0) + durationMinutes;
        }
      });
    });

    const pieData = Object.keys(tagTotals).map(tag => ({
      name: tag,
      value: Math.round(tagTotals[tag] * 10) / 10,
    }));

    const barData = Object.keys(dailyTotals).map(day => ({
      name: day,
      'Số phút': Math.round(dailyTotals[day]),
    })).sort((a,b) => a.name.localeCompare(b.name));

    const totalMinutes = pieData.reduce((sum, item) => sum + item.value, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const totalTasks = processedTaskIds.size; // Lấy tổng số task

    return { pieData, barData, totalHours, totalTasks };
  };

  const { pieData, barData, totalHours, totalTasks } = processData();
  const COLORS = ['#f7bd00', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-full pb-28 md:pb-10 relative">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#f7bd00]/5 dark:bg-[#f7bd00]/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f7bd00]/10 rounded-xl flex items-center justify-center text-[#d97706] dark:text-[#f7bd00]">
            <BarChart2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Thống Kê Năng Suất</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Báo cáo thô chi tiết xử lý Task</p>
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
        {/* Thẻ Job - Trên mobile chiếm full 2 cột */}
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-[#f7bd00]/30 transition-colors">
          <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-xl"><CheckSquare size={26}/></div>
          <div>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Đã xử lý</p>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-0.5 tabular-nums">{totalTasks} <span className="text-sm font-bold text-zinc-500">Task</span></h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-[#f7bd00]/30 transition-colors">
          <div className="p-3.5 bg-[#f7bd00]/10 text-[#d97706] dark:text-[#f7bd00] rounded-xl"><Clock size={26}/></div>
          <div>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Thời gian</p>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white mt-0.5 tabular-nums">{totalHours} <span className="text-sm font-bold text-zinc-500">Giờ</span></h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-[#f7bd00]/30 transition-colors overflow-hidden">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl flex-shrink-0"><TrendingUp size={26}/></div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate">Dự án năng suất nhất</p>
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white mt-1.5 truncate">
              {pieData.sort((a,b)=>b.value - a.value)[0]?.name || 'Chưa có'}
            </h3>
          </div>
        </div>
      </div>

      {/* 2 BIỂU ĐỒ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm lg:col-span-7 flex flex-col h-[350px] md:h-[400px]">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-6 flex items-center gap-2"><Calendar size={18} className="text-zinc-400"/> Biểu đồ thời gian làm việc</h3>
          <div className="flex-1 w-full text-xs font-bold">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 font-medium border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Chưa có dữ liệu phiên làm việc</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip cursor={{ fill: 'rgba(128,128,128,0.05)' }} contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#f7bd00', fontWeight: 'bold' }} />
                  <Bar dataKey="Số phút" fill="#f7bd00" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm lg:col-span-5 flex flex-col h-[350px] md:h-[400px]">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2"><PieIcon size={18} className="text-zinc-400"/> Phân bổ tỷ lệ danh mục (%)</h3>
          <div className="flex-1 w-full text-xs font-bold relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-400 font-medium border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
    </div>
  );
}