import axios from "axios";

// ================= AXIOS INSTANCE =================

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});


// ================= REQUEST INTERCEPTOR =================

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// ================= RESPONSE INTERCEPTOR =================

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else        prom.resolve(token);
  });
  refreshQueue = [];
};

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.expired === true &&
      !original._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return API(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh`,  // ✅ clean, reuses the same variable
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        localStorage.setItem("accessToken", newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return API(original);

      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;