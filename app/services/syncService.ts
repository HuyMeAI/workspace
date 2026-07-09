import db from '../db/workspaceDB';

const API_URL = 'https://api.tranduchuy.com/api';

// 1. ĐỊNH NGHĨA CÁC INTERFACE ĐỂ KHỬ SẠCH LỖI TYPESCRIPT
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
  pushToServer: async () => {
    if (!navigator.onLine) return; 

    try {
      const unsyncedFolders = await db.folders.where('is_synced').equals(0).toArray() as LocalFolder[];
      for (const folder of unsyncedFolders) {
        const method = folder.id > 1000000 ? 'POST' : 'PUT';
        const url = method === 'POST' ? `${API_URL}/folders` : `${API_URL}/folders/${folder.id}`;

        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(folder)
        });

        if (res.ok) await db.folders.update(folder.id, { is_synced: 1 });
      }

      const unsyncedTasks = await db.tasks.where('is_synced').equals(0).toArray() as LocalTask[];
      for (const task of unsyncedTasks) {
        const method = task.id > 1000000 ? 'POST' : 'PUT';
        const url = method === 'POST' ? `${API_URL}/tasks` : `${API_URL}/tasks/${task.id}`;

        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(task)
        });

        if (res.ok) await db.tasks.update(task.id, { is_synced: 1 });
      }
    } catch (error) {
      console.error('Lỗi pushToServer:', error);
    }
  },

  pullFromServer: async () => {
    if (!navigator.onLine) return;

    try {
      const folderRes = await fetch(`${API_URL}/folders`);
      if (folderRes.ok) {
        const serverFolders: LocalFolder[] = await folderRes.json();
        const localUnsyncedFolders = await db.folders.where('is_synced').equals(0).toArray() as LocalFolder[];
        const unsyncedFolderIds = new Set(localUnsyncedFolders.map(f => f.id));
        
        for (const sf of serverFolders) {
          if (!unsyncedFolderIds.has(sf.id)) {
            await db.folders.put({ ...sf, is_synced: 1 });
          }
        }
      }

      const taskRes = await fetch(`${API_URL}/tasks`);
      if (taskRes.ok) {
        const serverTasks: ServerTask[] = await taskRes.json();
        const localUnsyncedTasks = await db.tasks.where('is_synced').equals(0).toArray() as LocalTask[];
        const unsyncedTaskIds = new Set(localUnsyncedTasks.map(t => t.id));
        
        const tasksToPut = serverTasks.map((st: ServerTask) => {
          let parsedLogs: { start: string; end: string | null }[] = [];
          if (typeof st.time_logs === 'string') {
            try { parsedLogs = JSON.parse(st.time_logs); } catch (e) { parsedLogs = []; }
          } else if (Array.isArray(st.time_logs)) {
            parsedLogs = st.time_logs as { start: string; end: string | null }[];
          }
          return { ...st, time_logs: parsedLogs, is_synced: 1, is_playing: st.is_playing ? 1 : 0 };
        }).filter((st) => !unsyncedTaskIds.has(st.id));

        await db.tasks.bulkPut(tasksToPut);
      }
    } catch (error) {
      console.error('Lỗi pullFromServer:', error);
    }
  }
};