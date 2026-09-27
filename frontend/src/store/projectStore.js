import { create } from "zustand";
import apiClient from "@/services/apiClient";

export const useProjectStore = create((set) => ({
    projects: [],
    loading: false,
    error: null,

    // ZMIANA: getProjects → fetchProjects
    fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get('/api/v1/project/all');
            set({ projects: response.data, loading: false });
        } catch (e) {
            console.error('Error fetching projects:', e);
            set({ error: e.message, loading: false });
        }
    },

    // ZMIANA: addProject → createProject
    createProject: async (project) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post('/api/v1/project/create', project);
            set((state) => ({
                projects:  [...state.projects, response.data],
                loading: false
            }));
            return response.data;
        } catch (e) {
            console.error('Error creating project:', e);
            set({ error: e.message, loading: false });
            throw e;
        }
    },

    deleteProject: async (projectId) => {
        try {
            await apiClient.delete(`/api/v1/project/id/${projectId}`);
            set((state) => ({
                projects: state.projects.filter(p => p.id !== projectId)
            }));
        } catch (e) {
            console.error('Error deleting project:', e);
            throw e;
        }
    }
}));