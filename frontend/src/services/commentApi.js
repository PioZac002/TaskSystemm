import apiClient from './apiClient';

export const commentApi = {
    async create(commentData) {
        const res = await apiClient.post('/api/v1/comment/create', commentData);
        return res.data;
    },
    
    async getByIssueId(issueId) {
        const res = await apiClient.get(`/api/v1/comment/issue/${issueId}`);
        return res.data;
    },
    
    async deleteComment(id) {
        const res = await apiClient.delete(`/api/v1/comment/${id}`);
        return res.data;
    },
    
    async deleteAllByIssueId(issueId) {
        const res = await apiClient.delete(`/api/v1/comment/issue/${issueId}`);
        return res.data;
    }
};

export default commentApi;
