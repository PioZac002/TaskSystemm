import apiClient from './apiClient';

export const teamApi = {
    async getAll() {
        const res = await apiClient.get('/api/v1/team/all');
        return res.data;
    },
    
    async getById(id) {
        const res = await apiClient.get(`/api/v1/team/id/${id}`);
        return res.data;
    },
    
    async create(teamData) {
        const res = await apiClient.post('/api/v1/team/create', teamData);
        return res.data;
    },
    
    async getIssuesByTeamId(teamId) {
        const res = await apiClient.get(`/api/v1/team/issues/${teamId}`);
        return res.data;
    },
    
    async getUsersByTeamId(teamId) {
        const res = await apiClient.get(`/api/v1/team/users/${teamId}`);
        return res.data;
    },
    
    async addUserToTeam(teamId, userId) {
        const res = await apiClient.put(`/api/v1/team/${teamId}/add-user/${userId}`);
        return res.data;
    },
    
    async removeUserFromTeam(teamId, userId) {
        const res = await apiClient.put(`/api/v1/team/${teamId}/remove-user/${userId}`);
        return res.data;
    }
};

export default teamApi;
