import axios from 'axios';

const api = axios.create({
    baseURL: `http://${window.location.hostname}:8000`,
    withCredentials: true, // Required for Sanctum cookies
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use((config) => {
    // Manually read XSRF-TOKEN cookie because Axios drops it for cross-port requests
    const xsrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    if (xsrfToken) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    }

    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // If they are not already on auth page, redirect them
            if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
                window.location.href = '/auth';
            }
        }
        return Promise.reject(error);
    }
);

export default api;