import db from '../db/workspaceDB';

const API_URL = 'https://api.tranduchuy.com/api'; // URL API Server Laravel của bạn

// 1. ĐỊNH NGHĨA CÁC INTERFACE ĐỂ KHỬ SẠCH LỖI TYPESCRIPT STRICT MODE
interface LocalFolder {
  id: number;
  name: string;
  calendar_id?: string | null;
  is_readonly: number | boolean;
  order?: number;
  is_synced?: number;
  [key: string]: unknown;
}

interface LocalTask {
  id: number;
  title: string;
  description?: string;
  status: string;
  tag: string;
  priority: string;
  start_datetime?: string | null;
  end_datetime?: string | null;
  is_playing?: boolean | number;
  time_logs?: { start: string; end: string | null }[] | string;
  is_synced?: number;
  google_event_id?: string | null;
  [key: string]: unknown;
}

interface ServerTask {
  id: number;
  title: string;
  description?: string;
  status: string;
  tag: string;
  priority: string;
  start_datetime?: string | null;
  end_datetime?: string | null;
  is_playing?: boolean | number;
  time_logs?: string | { start: string; end: string | null }[];
  google_event_id?: string | null;
  [key: string]: unknown;
}

export const syncService = {
  // =========================================================================
  // 1. ĐẨY DỮ LIỆU TỪ LOCAL LÊN SERVER (Ghi dữ liệu tạo/sửa lúc Offline)
  // =========================================================================
  pushToServer: async () => {
    if (!navigator.onLine) return; // Không có mạng thì âm thầm bỏ qua

    try {
      // --- A. ĐẨY LÊN CÁC THƯ MỤC (FOLDERS) CHƯA ĐỒNG BỘ ---
      const unsyncedFolders = await db.folders.where('is_synced').equals(0).toArray() as LocalFolder[];
      for (const folder of unsyncedFolders) {
        // Mẹo phân biệt: Nếu id > 1000000 (do Date.now() cấp lúc offline) thì POST tạo mới, ngược lại là PUT sửa
        const method = folder.id > 1000000 ? 'POST' : 'PUT';
        const url = method === 'POST' ? `${API_URL}/folders` : `${API_URL}/folders/${folder.id}`;

        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(folder)
        });

        if (res.ok) {
          // Nếu thành công, đánh dấu trạng thái đồng bộ về 1
          await db.folders.update(folder.id, { is_synced: 1 });
        }
      }

      // --- B. ĐẨY LÊN CÁC CÔNG VIỆC (TASKS) CHƯA ĐỒNG BỘ ---
      const unsyncedTasks = await db.tasks.where('is_synced').equals(0).toArray() as LocalTask[];
      for (const task of unsyncedTasks) {
        const method = task.id > 1000000 ? 'POST' : 'PUT';
        const url = method === 'POST' ? `${API_URL}/tasks` : `${API_URL}/tasks/${task.id}`;

        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(task)
        });

        if (res.ok) {
          await db.tasks.update(task.id, { is_synced: 1 });
        }
      }

    } catch (error) {
      console.error('Lỗi trong quá trình pushToServer:', error);
    }
  },

  // =========================================================================
  // 2. KÉO DỮ LIỆU TỪ SERVER VỀ LOCAL (Cập nhật thay đổi từ iPhone sang Laptop)
  // =========================================================================
  pullFromServer: async () => {
    if (!navigator.onLine) return;

    try {
      // --- A. KÉO DỮ LIỆU THƯ MỤC (FOLDERS) ---
      const folderRes = await fetch(`${API_URL}/folders`);
      if (folderRes.ok) {
        const serverFolders: LocalFolder[] = await folderRes.json();
        
        // Tạo hàng rào bảo vệ: Lấy ID các thư mục Local đang sửa dở (chưa kịp push) để không bị đè mất
        const localUnsyncedFolders = await db.folders.where('is_synced').equals(0).toArray() as LocalFolder[];
        const unsyncedFolderIds = new Set(localUnsyncedFolders.map(f => f.id));
        
        for (const sf of serverFolders) {
          if (!unsyncedFolderIds.has(sf.id)) {
            // put() sẽ kiểm tra: Nếu chưa có ID thì thêm mới, có rồi thì cập nhật ghi đè
            await db.folders.put({ ...sf, is_synced: 1 });
          }
        }
      }

      // --- B. KÉO DỮ LIỆU CÔNG VIỆC (TASKS) ---
      const taskRes = await fetch(`${API_URL}/tasks`);
      if (taskRes.ok) {
        const serverTasks: ServerTask[] = await taskRes.json();
        
        const localUnsyncedTasks = await db.tasks.where('is_synced').equals(0).toArray() as LocalTask[];
        const unsyncedTaskIds = new Set(localUnsyncedTasks.map(t => t.id));
        
        // Xử lý dữ liệu thô từ Server về trước khi nạp vào Dexie
        const tasksToPut = serverTasks
          .map((st: ServerTask) => {
            let parsedLogs: { start: string; end: string | null }[] = [];
            
            // Ép kiểu chuỗi TEXT mã hóa JSON từ MySQL của Laravel về mảng Array của JS
            if (typeof st.time_logs === 'string') {
              try { 
                parsedLogs = JSON.parse(st.time_logs); 
              } catch (e) {
                parsedLogs = [];
              }
            } else if (Array.isArray(st.time_logs)) {
              parsedLogs = st.time_logs as { start: string; end: string | null }[];
            }
            
            return { 
              ...st, 
              time_logs: parsedLogs, 
              is_synced: 1, 
              is_playing: st.is_playing ? 1 : 0 
            };
          })
          // Chỉ lấy các Task không nằm trong danh sách đang đợi đồng bộ ở Local
          .filter((st) => !unsyncedTaskIds.has(st.id));

        // bulkPut giúp đẩy hàng loạt mảng dữ liệu vào DB tốc độ cao
        await db.tasks.bulkPut(tasksToPut);
      }

    } catch (error) {
      console.error('Lỗi trong quá trình pullFromServer:', error);
    }
  }
};