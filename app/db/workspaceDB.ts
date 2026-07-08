import Dexie, { type Table } from 'dexie';

export class WorkspaceDB extends Dexie {
  tasks!: Table<any>;
  folders!: Table<any>; // Thêm bảng quản lý Thư mục

  constructor() {
    super('WorkspaceDB');
    
    // VERSION 2: GIỮ NGUYÊN ĐỂ DEXIE BIẾT CẤU TRÚC CŨ LÀ GÌ
    this.version(2).stores({
      tasks: '++id, title, description, tag, priority, status, start_datetime, end_datetime, tg_notified, is_synced',
      folders: '++id, name, calendar_id, is_readonly'
    });

    // VERSION 3: BẢN NÂNG CẤP MỚI NHẤT BỔ SUNG 'is_playing' ĐỂ CHO PHÉP TÌM KIẾM
    this.version(3).stores({
      tasks: '++id, title, description, tag, priority, status, start_datetime, end_datetime, tg_notified, is_synced, is_playing',
      folders: '++id, name, calendar_id, is_readonly' 
    });

    // Tự động bơm dữ liệu mặc định của bạn vào lần đầu chạy app
    this.on('ready', async () => {
      const count = await this.folders.count();
      if (count === 0) {
        await this.folders.bulkAdd([
          { name: 'Flyday Media', calendar_id: 'c_4b3rd4p2v32thsbur2vvqe14h8@group.calendar.google.com', is_readonly: 0 },
          { name: 'Học Làm Phim', calendar_id: 'c_munmuqpiupjfgr7cpl9mknom54@group.calendar.google.com', is_readonly: 0 },
          { name: 'Gia đình', calendar_id: 'c_8ojh6dfqqllr79r27hkumdrmn4@group.calendar.google.com', is_readonly: 0 },
          { name: 'Cá nhân', calendar_id: 'c_khfr69b51v6ggn6s12eku46h60@group.calendar.google.com', is_readonly: 0 },
          { name: 'Hẹn hò', calendar_id: 'huy@tranduchuy.com', is_readonly: 0 },
          { name: 'Ngày lễ', calendar_id: 'vi.vietnamese#holiday@group.v.calendar.google.com', is_readonly: 1 } // Lịch hệ thống
        ]);
      }
    });
  }
}

const db = new WorkspaceDB();
export default db;