// src/lib/api.ts
import axios from 'axios';

// Lấy base URL từ ENV, bỏ dấu "/" cuối cho sạch
const BASE_URL =
  (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '');

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
});

// (Khuyến nghị) Retry đơn giản để qua cold start Render
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const cfg: any = error.config || {};
    cfg.__retryCount = cfg.__retryCount || 0;
    // Retry tối đa 3 lần với backoff 1s, 2s, 4s cho lỗi mạng/timeout/5xx
    const retriable =
      !error.response || (error.response.status >= 500 && error.response.status <= 599);
    if (!retriable || cfg.__retryCount >= 3) throw error;
    cfg.__retryCount += 1;
    const wait = 1000 * Math.pow(2, cfg.__retryCount - 1);
    await new Promise((r) => setTimeout(r, wait));
    return api(cfg);
  }
);

console.log('[API] baseURL =', BASE_URL);

export default api;
