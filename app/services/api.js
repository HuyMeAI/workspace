import axios from 'axios';

// Đây là trạm trung chuyển. Tạm thời mình để link API của Laravel chạy local (port 8000)
const API_BASE_URL = 'https://api.tranduchuy.com/api'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, 
});

export const taskAPI = {
  getAllTasks: () => apiClient.get('/tasks'),
  createTask: (taskData) => apiClient.post('/tasks', taskData),
  updateTask: (id, taskData) => apiClient.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
};

export default apiClient;