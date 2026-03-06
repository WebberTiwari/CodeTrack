import axios from "axios";

// ================= AXIOS INSTANCE =================

const API = axios.create({
  baseURL:      "http://localhost:5000/api",
  withCredentials: true, // needed to send/receive httpOnly cookies
});


// ================= REQUEST INTERCEPTOR =================
// Attach access token to every request

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
// Auto-refresh access token when it expires (401 + expired flag)

let isRefreshing  = false;
let refreshQueue  = []; // queue of requests waiting for new token

const processQueue = (error, token = null) => {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  refreshQueue = [];
};

API.interceptors.response.use(
  (response) => response, // pass through successful responses

  async (error) => {
    const original = error.config;

    // Only handle 401 expired token errors, and don't retry more than once
    if (
      error.response?.status === 401 &&
      error.response?.data?.expired === true &&
      !original._retry
    ) {
      // If already refreshing, queue this request
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

      original._retry   = true;
      isRefreshing      = true;

      try {
        // Call refresh endpoint — uses httpOnly cookie automatically
        const { data } = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;

        // Save new access token
        localStorage.setItem("accessToken", newToken);

        // Update header for current request
        original.headers.Authorization = `Bearer ${newToken}`;

        // Resolve all queued requests with new token
        processQueue(null, newToken);

        return API(original);

      } catch (refreshError) {
        // Refresh token also expired — force logout
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