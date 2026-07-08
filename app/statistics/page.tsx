'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/app/db/workspaceDB';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter, parseISO } from 'date-fns';
import { BarChart2, Calendar, Clock, PieChart as PieIcon, TrendingUp } from 'lucide-react';

export default function StatisticsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');

  // 1. LẤY TOÀN BỘ TASK TỪ DEXIE DB
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // 2. THUẬT TOÁN XỬ LÝ DATA RAW SANG ĐỒ THỊ
  const processData = () => {
    const now = new Date();
    let filterDate = startOfWeek(now, { weekStartsOn: 1 }); // Mặc định tuần này

    if (timeRange === 'day') filterDate = startOfDay(now);
    if (timeRange === 'month') filterDate = startOfMonth(now);
    if (timeRange === 'year') filterDate = startOfYear(now);

    // Khởi tạo đối tượng gom nhóm dữ liệu theo Thư mục (Tag)
    const tagTotals: Record<string, number> = {};
    // Khởi tạo đối tượng gom nhóm dữ liệu theo Ngày làm việc (Dành cho biểu đồ cột)
    const dailyTotals: Record<string, number> = {};

    tasks.forEach((task: any) => {
      const logs = Array.isArray(task.time_logs) ? task.time_logs : [];
      
      logs.forEach((log: any) => {
        if (!log || !log.start) return;
        const startLogDate = parseISO(log.start);

        // Lọc log nằm trong khoảng thời gian đã chọn (Ngày/Tuần/Tháng/Năm)
        if (isAfter(startLogDate, filterDate)) {
          const endLogDate = log.end ? parseISO(log.end) : new Date();
          const durationSeconds = Math.max(0, Math.floor((endLogDate.getTime() - startLogDate.getTime()) / 1000));
          const durationMinutes = durationSeconds / 60;

          // Gom nhóm theo Thư mục (Tag)
          const currentTag = task.tag || 'Mặc định';
          tagTotals[currentTag] = (tagTotals[currentTag] || 0) + durationMinutes;

          // Gom nhóm theo Ngày (Định dạng Thứ/Ngày)
          const dayName = startLogDate.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' });
          dailyTotals[dayName] = (dailyTotals[dayName] || 0) + durationMinutes;
        }
      });
    });

    // Định dạng lại dữ liệu cho Biểu đồ Tròn (PieChart)
    const pieData = Object.keys(tagTotals).map(tag => ({
      name: tag,
      value: Math.round(tagTotals[tag] * 10) / 10, // Làm tròn 1 chữ số thập phân
    }));

    // Định dạng lại dữ liệu cho Biểu đồ Cột (BarChart)
    const barData = Object.keys(dailyTotals).map(day => ({
      name: day,
      'Số phút': Math.round(dailyTotals[day]),
    })).sort((a,b) => a.name.localeCompare(b.name)); // Sắp xếp theo thứ tự ngày tuyến tính

    // Tính tổng thời gian làm việc trong chu kỳ
    const totalMinutes = pieData.reduce((sum, item) => sum + item.value, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return { pieData, barData, totalHours };
  };

  const { pieData, barData, totalHours } = processData();

  // BẢNG MÀU UI CAO CẤP CHUẨN DARK/LIGHT MODE CHO BIỂU ĐỒ TRÒN
  const COLORS = ['#f7bd00', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-full pb-28 md:pb-10 relative">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#f7bd00]/5 dark:bg-[#f7bd00]/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* HEADER TRANG THỐNG KÊ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f7bd00]/10 rounded-xl flex items-center justify-center text-[#d97706] dark:text-[#f7bd00]">
            <BarChart2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Thống Kê Năng Suất</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Báo cáo thô chi tiết khung giờ xử lý Task</p>
          </div>
        </div>

        {/* THANH ĐIỀU HƯỚNG BỘ LỌC THỜI GIAN */}
        <div className="flex bg-zinc-200/50 dark:bg-black/50 p-1 rounded-xl border border-zinc-200 dark:border-white/5 backdrop-blur-md w-full sm:w-auto overflow-x-auto">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${timeRange === range ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              {range === 'day' ? 'Hôm nay' : range === 'week' ? 'Tuần này' : range === 'month' ? 'Tháng này' : 'Năm này'}
            </button>
          ))}
        </div>
      </div>

      {/* THẺ TỔNG QUAN (OVERVIEW CARD) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#f7bd00]/10 text-[#d97706] dark:text-[#f7bd00] rounded-xl"><Clock size={24}/></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tổng thời gian</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 tabular-nums">{totalHours} <span className="text-sm font-bold text-zinc-500">Giờ</span></h3>
          </div>
        </div>
        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp size={24}/></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Thư mục hoạt động nhiều nhất</p>
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white mt-1 truncate max-w-[200px]">
              {pieData.sort((a,b)=>b.value - a.value)[0]?.name || 'Chưa có dữ liệu'}
            </h3>
          </div>
        </div>
      </div>

      {/* PHẦN ĐỒ THỊ BIỂU ĐỒ (CHARTS CONTAINER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* BIỂU ĐỒ CỘT - THỜI GIAN THEO TỪNG NGÀY (8 CỘT) */}
        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm lg:col-span-7 flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-6 flex items-center gap-2"><Calendar size={18}/> Biểu đồ thời gian làm việc</h3>
          <div className="flex-1 w-full text-xs font-bold">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 font-medium">Chưa có dữ liệu phiên làm việc trong chu kỳ này</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#f7bd00', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Số phút" fill="#f7bd00" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* BIỂU ĐỒ TRÒN - TỶ LỆ % THEO DANH MỤC THƯ MỤC (4 CỘT) */}
        <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm lg:col-span-5 flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2"><PieIcon size={18}/> Phân bổ tỷ lệ danh mục (%)</h3>
          <div className="flex-1 w-full text-xs font-bold relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-zinc-400 font-medium">Chưa ghi nhận thời gian xử lý thư mục</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} phút`} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', paddingClassName: 'pt-4', color: '#71717a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}