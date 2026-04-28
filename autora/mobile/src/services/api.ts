import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  sendOtp: (phone: string) => api.post("/auth/send-otp", { phone }),
  verifyOtp: (phone: string, code: string) => api.post("/auth/verify-otp", { phone, code }),
  register: (name: string, role: string) => api.post("/auth/register", { name, role }),
  getMe: () => api.get("/auth/me"),
};

export const providerApi = {
  list: (params?: Record<string, string>) => api.get("/providers", { params }),
  nearby: (lat: number, lng: number, radius?: number, category?: string) =>
    api.get("/providers/nearby", { params: { lat, lng, radius, category } }),
  getById: (id: string) => api.get(`/providers/${id}`),
  create: (data: Record<string, unknown>) => api.post("/providers", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/providers/${id}`, data),
};

export const bookingApi = {
  create: (data: Record<string, unknown>) => api.post("/bookings", data),
  list: (status?: string) => api.get("/bookings", { params: { status } }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/bookings/${id}/status`, { status }),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
};

export const towingApi = {
  request: (data: Record<string, unknown>) => api.post("/towing/request", data),
  nearby: (lat: number, lng: number) => api.get("/towing/nearby", { params: { lat, lng } }),
  accept: (id: string) => api.patch(`/towing/${id}/accept`),
  updateStatus: (id: string, status: string) => api.patch(`/towing/${id}/status`, { status }),
  getById: (id: string) => api.get(`/towing/${id}`),
};

export const reviewApi = {
  create: (data: Record<string, unknown>) => api.post("/reviews", data),
  list: (targetType: string, targetId: string) =>
    api.get("/reviews", { params: { targetType, targetId } }),
};

export const notificationApi = {
  list: () => api.get("/notifications"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export default api;
