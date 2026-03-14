import api from './axios';

export const login = async (credentials: { login: string; password: string }) => {
    // 1. Get the "Security Cookie" first
    await api.get('/sanctum/csrf-cookie');
    
    // 2. Now send the actual login request
    return api.post('/login', credentials);
};