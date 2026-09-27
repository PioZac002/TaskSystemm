import apiClient from './apiClient';

import { API_BASE_URL } from './apiBase';

export const fileService = {
    async uploadFile(file, commentId) {
        const formData = new FormData();
        formData.append('File', file);
        formData.append('CommentId', String(commentId));
        const response = await apiClient.post('/api/v1/file', formData);
        return response.data;
    },

    async deleteFile(fileId) {
        await apiClient.delete(`/api/v1/file/${fileId}`);
    },

    async fetchFileBlob(fileId) {
        const response = await apiClient.get(`/api/v1/file/${fileId}`, {
            responseType: 'blob'
        });
        return URL.createObjectURL(response.data);
    },

    getFileUrl(fileId) {
        return `${API_BASE_URL}/api/v1/file/${fileId}`;
    },
};
