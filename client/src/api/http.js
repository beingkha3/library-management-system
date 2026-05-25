import axios from 'axios';

const storageKey = 'library-management-system-auth';
export const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getStoredAuth = () => {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch (_error) {
    return null;
  }
};

export const setStoredAuth = (value) => {
  if (!value) {
    localStorage.removeItem(storageKey);
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(value));
};

export const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();

  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isConnectionIssue = !error.response;
    const message = isConnectionIssue
      ? `Unable to connect to the server. Please make sure the backend is running. Expected API URL: ${apiBaseUrl}`
      : error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);
