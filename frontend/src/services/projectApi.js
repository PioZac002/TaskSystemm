import apiClient from './apiClient';

export async function fetchProjects() {
    const res = await apiClient.get('/api/v1/project/all');
    return res.data;
}

export async function createProject(payload) {
    const res = await apiClient.post('/api/v1/project/create', payload);
    return res.data;
}

export async function fetchProjectById(id) {
    const res = await apiClient.get(`/api/v1/project/${id}`);
    return res.data;
}
