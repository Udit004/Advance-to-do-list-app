import axios from 'axios';
import { auth } from '../firebase'; // Import Firebase auth instance

// Use VITE_API_URL from environment variables
// It's recommended to use environment variables for API URLs.
// For example, in your .env file: VITE_API_URL=http://localhost:5000 or VITE_API_URL=https://your-production-api.com
const baseURL = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: baseURL,
  withCredentials: true, // This is crucial for sending cookies and authorization headers with cross-origin requests.
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
API.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
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
