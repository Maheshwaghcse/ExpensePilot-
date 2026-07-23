const getCookieValue = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
};

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true, // required for secure HttpOnly cookie storage
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Seamless Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the access token
        const res = await axios.post(
          'http://localhost:5000/api/v1/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        const { accessToken } = res.data;
        localStorage.setItem('accessToken', accessToken);

        // Update authorization header on the original request and retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
