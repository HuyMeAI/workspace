import db from '../db/workspaceDB';

const API_URL = 'https://api.tranduchuy.com/api'; // Hãy đảm bảo URL đúng với Server của bạn

// 1. KHAI BÁO KIỂU DỮ LIỆU ĐỂ TYPESCRIPT NGỪNG BÁO LỖI
interface LocalData {
  id: number;
  [key: string]: unknown; // Cho phép chứa các trường dữ liệu tùy ý khác
}

interface ServerTask extends LocalData {
  time_logs?: string | unknown[];
  is_playing?: boolean | number;
}

export const syncService = {
  // 1. ĐẨY DỮ LIỆU TỪ LOCAL LÊN SERVER (Áp dụng cho những dữ liệu tạo/sửa lúc Offline)
  pushToServer: async () => {
    if (!navigator.onLine) return; // Không có mạng thì dừng

    try {
      // --- ĐẨY TASKS ---
      const unsyncedTasks = await db.tasks.where('is_synced').equals(0).toArray();
      for (const task of unsyncedTasks) {
        // Cách kiểm tra: Nếu ID lớn hơn 1 triệu (ID ảo do Date.now() tạo) thì POST, ngược lại là PUT
        const method = task.id > 1000000 ? 'POST' : 'PUT'; 
        const url = method === 'POST' ? `${API_URL}/tasks` : `${API_URL}/tasks/${task.id}`;
        
        await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(task)
        });
        
        // Đẩy xong thì cập nhật lại local là đã đồng bộ
        await db.tasks.update(task.id, { is_synced: 1 });
      }

      // --- ĐẨY FOLDERS ---
      const unsyncedFolders = await db.folders.where('is_synced').equals(0).toArray();
      for (const folder of unsyncedFolders) {
        await fetch(`${API_URL}/folders/${folder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(folder)
        });
        await db.folders.update(folder.id, { is_synced: 1 });
      }

    } catch (error) {
      console.error('Lỗi khi Push dữ liệu lên Server:', error);
    }
  },

  // 2. KÉO DỮ LIỆU TỪ SERVER VỀ CẬP NHẬT CHO LOCAL (Đồng bộ đa thiết bị)
  pullFromServer: async () => {
    if (!navigator.onLine) return;

    try {
      // --- KÉO THƯ MỤC (FOLDERS) TRƯỚC ---
      const folderRes = await fetch(`${API_URL}/folders`);
      if (folderRes.ok) {
        const serverFolders: LocalData[] = await folderRes.json();
        
        // Ép kiểu (f: LocalData) để sửa lỗi gạch chân "Implicit any"
        const unsyncedFolderIds = new Set(
          (await db.folders.where('is_synced').equals(0).toArray()).map((f: LocalData) => f.id)
        );
        
        for (const sf of serverFolders) {
          if (!unsyncedFolderIds.has(sf.id)) {
            await db.folders.put({ ...sf, is_synced: 1 }); // put() sẽ Tạo mới nếu chưa có, Ghi đè nếu đã có
          }
        }
      }

      // --- KÉO CÔNG VIỆC (TASKS) SAU ---
      const taskRes = await fetch(`${API_URL}/tasks`);
      if (taskRes.ok) {
        const serverTasks: ServerTask[] = await taskRes.json();
        
        // Ép kiểu (t: LocalData) để sửa lỗi gạch chân "Implicit any"
        const unsyncedTaskIds = new Set(
          (await db.tasks.where('is_synced').equals(0).toArray()).map((t: LocalData) => t.id)
        );
        
        // Lọc và lưu vào Dexie những task từ Server về (Loại trừ task đang sửa dở chưa Push)
        const tasksToPut = serverTasks.map((st: ServerTask) => {
          let logs: unknown[] = [];
          
          if (typeof st.time_logs === 'string') {
            try { logs = JSON.parse(st.time_logs); } catch(e) {}
          } else if (Array.isArray(st.time_logs)) {
            logs = st.time_logs;
          }
          
          return { ...st, time_logs: logs, is_synced: 1, is_playing: st.is_playing ? 1 : 0 };
        }).filter((st: ServerTask) => !unsyncedTaskIds.has(st.id));

        await db.tasks.bulkPut(tasksToPut);
      }

    } catch (error) {
      console.error('Lỗi khi Pull dữ liệu từ Server:', error);
    }
  }
};