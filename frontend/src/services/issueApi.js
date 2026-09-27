// src/services/issueApi.js
import apiClient from "./apiClient";

export const issueApi = {
    // Pobranie wszystkich issue
    async getAll() {
        const res = await apiClient.get("/api/v1/issue/all");
        return res.data;
    },

    // Pobranie issue po id
    async getById(id) {
        const res = await apiClient.get(`/api/v1/issue/id/${id}`);
        return res.data;
    },

    // Pobranie issue po kluczu
    async getByKey(key) {
        const res = await apiClient.get(`/api/v1/issue/key/${key}`);
        return res.data;
    },

    // Pobranie issue dla projektu
    async getByProject(projectId) {
        const res = await apiClient.get(`/api/v1/issue/project/${projectId}`);
        return res.data;
    },

    // Dodanie nowego issue
    async create(issueData) {
        const res = await apiClient.post("/api/v1/issue/create", issueData);
        return res.data;
    },

    async assignIssue(data) {
        const res = await apiClient.put('/api/v1/issue/assign', data);
        return res.data;
    },

    async renameIssue(data) {
        const res = await apiClient.put('/api/v1/issue/rename', data);
        return res.data;
    },

    async assignTeam(data) {
        const res = await apiClient.put('/api/v1/issue/assign-team', data);
        return res.data;
    },

    async updateStatus(data) {
        const res = await apiClient.put('/api/v1/issue/update-status', data);
        return res.data;
    },

    async updatePriority(data) {
        const res = await apiClient.put('/api/v1/issue/update-priority', data);
        return res.data;
    },

    async updateDueDate(data) {
        const res = await apiClient.put('/api/v1/issue/update-due-date', data);
        return res.data;
    },

    async getByUserId(userId) {
        const res = await apiClient.get(`/api/v1/issue/user/${userId}`);
        return res.data;
    },

    async deleteIssue(id) {
        const res = await apiClient.delete(`/api/v1/issue/${id}`);
        return res.data;
    },

    async deleteAllIssues() {
        const res = await apiClient.delete('/api/v1/issue/all');
        return res.data;
    }
};

export default issueApi;
