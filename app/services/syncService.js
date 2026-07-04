import db from '../db/workspaceDB';
import { taskAPI } from './api';

export const syncService = {
  // PUSH: Đẩy task từ máy bạn lên Server Laravel
  pushToServer: async () => {
    if (!navigator.onLine) return; 

    try {
      const unsyncedTasks = await db.tasks.where('is_synced').equals(0).toArray();
      if (unsyncedTasks.length === 0) return; 

      console.log(`Đang đẩy ${unsyncedTasks.length} tasks lên Server...`);

      for (const task of unsyncedTasks) {
        const { id, is_synced, ...taskDataToPush } = task; 
        await taskAPI.createTask(taskDataToPush);
        await db.tasks.update(task.id, { is_synced: 1 }); // Đẩy xong thì đánh dấu là 1
      }
      console.log('Push thành công!');
    } catch (error) {
      console.error('Lỗi khi Push dữ liệu:', error);
    }
  },

  // PULL: Kéo task từ Server Laravel về máy bạn
  pullFromServer: async () => {
    if (!navigator.onLine) return;

    try {
      const response = await taskAPI.getAllTasks();
      const serverTasks = response.data; 

      for (const sTask of serverTasks) {
        await db.tasks.put({
          ...sTask,
          is_synced: 1 
        });
      }
      console.log('Pull thành công!');
    } catch (error) {
      console.error('Lỗi khi Pull dữ liệu:', error);
    }
  }
};