import axios from 'axios';

// Use VITE_API_URL from environment variables
const baseURL = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: baseURL,
  withCredentials: false, // Set to true only if using cookies/sessions
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    // Example: Add Authorization token if needed
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('API Error Request:', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
