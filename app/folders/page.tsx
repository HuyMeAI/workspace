'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '@/app/db/workspaceDB';
import { Folder, Settings, Plus, Trash2, Info, X, Clock, GripVertical, Save, Edit3 } from 'lucide-react';
import EditTaskModal from '../components/EditTaskModal'; // Đảm bảo import đúng đường dẫn

export default function FoldersPage() {
  const [activeFolder, setActiveFolder] = useState<string>('Tất cả');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addId, setAddId] = useState('');

  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editId, setEditId] = useState('');

  const [editingTask, setEditingTask] = useState<any>(null);

  // State cho Kéo Thả
  const [draggedId, setDraggedId] = useState<number | null>(null);

  // Lấy dữ liệu và sắp xếp theo trường 'order'
  const folders = useLiveQuery(() => db.folders.toArray()) || [];
  const sortedFolders = folders.sort((a, b) => (a.order || 0) - (b.order || 0));
  const visibleFolders = sortedFolders.filter(f => !f.is_readonly); 
  
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  // Lọc task: Nếu là "Tất cả" thì lấy mọi task TRỪ "Ngày lễ". Nếu là thư mục khác thì lọc theo tag đó.
  const filteredTasks = activeFolder === 'Tất cả' 
    ? tasks.filter(t => t.tag !== 'Ngày lễ') 
    : tasks.filter(t => t.tag === activeFolder);
  // ---- HELPER FUNCTIONS ----
  const translatePriority = (p: string) => {
    switch(p) {
      case 'urgent': return 'Khẩn cấp';
      case 'high': return 'Cao';
      case 'medium': return 'Vừa';
      default: return 'Thấp';
    }
  };

  const getTimeRemaining = (endDateStr: string | null) => {
    if (!endDateStr) return 'Không có hạn';
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff < 0) return 'Đã quá hạn';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `Còn ${days} ngày`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `Còn ${hours} giờ`;
    return 'Sắp đến hạn';
  };

  // ---- LOGIC THƯ MỤC ----
  const handleSaveNewFolder = async () => {
    if (!addName.trim()) return alert('Vui lòng nhập tên thư mục!');
    // Thêm order = Date.now() để thư mục mới luôn nằm dưới cùng
    await db.folders.add({ name: addName.trim(), calendar_id: addId.trim(), is_readonly: 0, order: Date.now() });
    setIsAddModalOpen(false); setAddName(''); setAddId('');
  };

  const startEditing = (f: any) => { setEditingFolderId(f.id); setEditName(f.name); setEditId(f.calendar_id); };

  const handleSaveEdit = async (id: number, currentName: string) => {
    if (!editName.trim()) return setEditingFolderId(null);
    await db.folders.update(id, { name: editName.trim(), calendar_id: editId.trim() });
    if (editName.trim() !== currentName) {
      const tasksToUpdate = await db.tasks.where('tag').equals(currentName).toArray();
      for (const t of tasksToUpdate) await db.tasks.update(t.id, { tag: editName.trim() });
      if (activeFolder === currentName) setActiveFolder(editName.trim());
    }
    setEditingFolderId(null);
  };

  // ---- LOGIC KÉO THẢ (DRAG & DROP) ----
  const handleDragStart = (e: any, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: any) => e.preventDefault(); // Cần thiết để cho phép Drop

  const handleDrop = async (e: any, targetId: number) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newFolders = [...visibleFolders];
    const draggedIdx = newFolders.findIndex(f => f.id === draggedId);
    const targetIdx = newFolders.findIndex(f => f.id === targetId);

    // Cắt phần tử đang kéo và chèn vào vị trí đích
    const [draggedItem] = newFolders.splice(draggedIdx, 1);
    newFolders.splice(targetIdx, 0, draggedItem);

    // Cập nhật lại số thứ tự (order) vào DB
    for (let i = 0; i < newFolders.length; i++) {
      await db.folders.update(newFolders[i].id, { order: i });
    }
    setDraggedId(null);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-end mb-8 border-b border-zinc-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-3">
            <Folder className="text-[#f7bd00]" size={32} /> Thư mục
          </h1>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 transition">
          <Settings size={22} className="text-zinc-600 dark:text-zinc-300" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
        {/* CỘT TRÁI: DANH SÁCH THƯ MỤC */}
        <div className="w-full md:w-64 flex flex-col gap-2 overflow-y-auto no-scrollbar">
          <button onClick={() => setActiveFolder('Tất cả')} className={`text-left px-5 py-3.5 rounded-2xl font-bold transition-all ${activeFolder === 'Tất cả' ? 'bg-[#f7bd00] text-black shadow-md' : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}>Tất cả công việc</button>
          {visibleFolders.map(f => (
            <button key={f.id} onClick={() => setActiveFolder(f.name)} className={`text-left px-5 py-3.5 rounded-2xl font-bold transition-all ${activeFolder === f.name ? 'bg-[#f7bd00] text-black shadow-md' : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}>
              {f.name} <span className="text-xs ml-2 opacity-60">({tasks.filter(t => t.tag === f.name).length})</span>
            </button>
          ))}
        </div>

        {/* CỘT PHẢI: DANH SÁCH TASK */}
        <div className="flex-1 bg-white dark:bg-[#121214] rounded-3xl border border-zinc-200 dark:border-white/5 p-6 overflow-y-auto custom-scrollbar shadow-sm">
          <div className="space-y-3 mt-2">
            {filteredTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => setEditingTask(task)} 
                className="p-4 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-[#f7bd00]/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${task.status === 'done' ? 'bg-zinc-400' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-[#f7bd00]'}`}></div>
                    <span className={`font-bold ${task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>{task.title}</span>
                </div>
                
                {/* Đã loại bỏ Tag, hiển thị Thời gian và Ưu tiên (Tiếng Việt) */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-white/5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/5">
                    <Clock size={14} /> {getTimeRemaining(task.end_datetime)}
                  </div>
                  <span className={`text-[10px] uppercase font-extrabold px-2 py-1.5 rounded-md ${task.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : task.priority === 'high' ? 'bg-orange-500/10 text-orange-500' : task.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                    {translatePriority(task.priority)}
                  </span>
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && <p className="text-zinc-500 text-sm font-medium text-center mt-10">Chưa có công việc nào.</p>}
          </div>
        </div>
      </div>

      {/* MODAL CÀI ĐẶT THƯ MỤC (CÓ KÉO THẢ) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#18181b] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-black/20">
              <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="text-[#f7bd00]"/> Quản lý Thư mục</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-zinc-200 dark:bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition"><X size={18}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs text-zinc-500 font-bold mb-4 flex items-center gap-2"><Info size={14}/> Kéo thả biểu tượng 6 chấm để sắp xếp thứ tự ưu tiên.</p>
              
              {visibleFolders.map(f => (
                <div 
                  key={f.id} 
                  draggable={editingFolderId !== f.id} // Không cho kéo nếu đang gõ chữ sửa
                  onDragStart={(e) => handleDragStart(e, f.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, f.id)}
                  className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${draggedId === f.id ? 'opacity-40 bg-zinc-100 dark:bg-white/5' : 'bg-zinc-50 dark:bg-black/10 border-zinc-200 dark:border-white/10'}`}
                >
                  <div className="flex items-center gap-3 flex-1 overflow-hidden pr-4">
                    <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-[#f7bd00] p-1"><GripVertical size={20}/></div>
                    {editingFolderId === f.id ? (
                      <div className="flex-1 flex flex-col gap-2">
                          <input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-white dark:bg-black border rounded-xl px-3 py-2 text-sm font-bold focus:ring-[#f7bd00] outline-none" placeholder="Tên thư mục" />
                          <input type="text" value={editId} onChange={e=>setEditId(e.target.value)} className="w-full bg-white dark:bg-black border rounded-xl px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 focus:ring-[#f7bd00] outline-none" placeholder="ID Google Calendar" />
                      </div>
                    ) : (
                      <div className="flex-1 overflow-hidden">
                          <h3 className="font-bold text-base text-zinc-900 dark:text-white">{f.name}</h3>
                          <p className="text-xs text-zinc-500 truncate mt-1">ID: {f.calendar_id || 'Chưa liên kết'}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {editingFolderId === f.id ? (
                        <button onClick={() => handleSaveEdit(f.id, f.name)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition flex items-center gap-1"><Save size={16}/> Lưu</button>
                    ) : (
                        <button onClick={() => startEditing(f)} className="px-4 py-2 bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-white rounded-xl text-sm font-bold hover:bg-[#f7bd00] hover:text-black transition flex items-center gap-1"><Edit3 size={16}/> Sửa</button>
                    )}
                    <button onClick={() => { if(confirm('Chắc chắn xóa?')) db.folders.delete(f.id) }} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
              <button onClick={() => setIsAddModalOpen(true)} className="w-full py-3.5 bg-gradient-to-r from-[#f7bd00] to-[#f59e0b] text-black font-bold rounded-2xl shadow-md flex justify-center items-center gap-2"><Plus/> Thêm Thư mục mới</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP THÊM THƯ MỤC */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#18181b] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Thêm Thư Mục</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Tên thư mục *</label>
                        <input type="text" value={addName} onChange={e=>setAddName(e.target.value)} autoFocus className="w-full bg-zinc-50 dark:bg-black/50 border rounded-xl px-4 py-3 font-bold focus:ring-[#f7bd00] outline-none" placeholder="VD: Khách hàng VIP"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">ID Google Calendar</label>
                        <input type="text" value={addId} onChange={e=>setAddId(e.target.value)} className="w-full bg-zinc-50 dark:bg-black/50 border rounded-xl px-4 py-3 text-sm focus:ring-[#f7bd00] outline-none" placeholder="Để trống nếu chưa có"/>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 transition">Hủy</button>
                    <button onClick={handleSaveNewFolder} className="flex-1 py-3 rounded-xl font-bold bg-[#f7bd00] text-black hover:bg-[#e5ae00] transition shadow-md">Tạo mới</button>
                </div>
            </div>
        </div>
      )}

      {/* RENDER MODAL SỬA TASK. Thêm isOpen={true} để ép modal hiển thị */}
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