import axios from "axios";

// Use the public backend URL if available, otherwise fallback to /api proxy
const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const api = axios.create({
    baseURL: apiUrl,
});

// Request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect if unauthorized
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                if (!["/login", "/register", "/forgot-password"].includes(window.location.pathname)) {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
