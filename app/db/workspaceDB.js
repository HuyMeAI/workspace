import Dexie, { type Table } from 'dexie';

export class WorkspaceDB extends Dexie {
  // Ép TypeScript phải công nhận là có bảng tasks tồn tại
  tasks!: Table<any>; 

  constructor() {
    super('WorkspaceDB');
    this.version(1).stores({
      tasks: '++id, title, description, tag, priority, status, start_datetime, end_datetime, tg_notified, is_synced'
    });
  }
}

const db = new WorkspaceDB();
export default db;