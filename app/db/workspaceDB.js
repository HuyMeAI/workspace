import Dexie from 'dexie';

// 1. Khởi tạo cơ sở dữ liệu tên là WorkspaceDatabase
const db = new Dexie('WorkspaceDatabase');

// 2. Định nghĩa các bảng và các trường cần đánh chỉ mục (Index) để tìm kiếm nhanh
db.version(1).stores({
  tasks: '++id, title, tag, priority, status, start_datetime, end_datetime, tg_notified, is_synced',
  system_settings: 'setting_key, setting_value'
});

/* Ghi chú về các trường đặc biệt:
- tg_notified: 0 hoặc 1 (Để biết task này Backend đã quét gửi Telegram chưa)
- is_synced: 0 hoặc 1 (CỰC KỲ QUAN TRỌNG: Để biết dữ liệu này đã được đồng bộ lên host AZDigi chưa, hay mới chỉ lưu ở máy local)
*/

export default db;