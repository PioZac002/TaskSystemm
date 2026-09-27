import apiClient from './apiClient';

export const userApi = {
    async getAll() {
        const res = await apiClient.get('/api/v1/user/all');
        return res.data;
    },
    
    async getById(id) {
        const res = await apiClient.get(`/api/v1/user/id/${id}`);
        return res.data;
    },
    
    async getByEmail(email) {
        const res = await apiClient.get(`/api/v1/user/email/${email}`);
        return res.data;
    },
    
    async deleteUser(id) {
        const res = await apiClient.delete(`/api/v1/user/${id}`);
        return res.data;
    },
    
    async deleteAllUsers() {
        const res = await apiClient.delete('/api/v1/user/all');
        return res.data;
    }
};

export default userApi;
