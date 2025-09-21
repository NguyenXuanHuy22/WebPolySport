// src/utils/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // backend Node.js chạy ở cổng 5000
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
