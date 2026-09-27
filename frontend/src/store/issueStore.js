import { create } from "zustand";
import apiClient from "@/services/apiClient";

export const useIssueStore = create((set, get) => ({
    issues: [],
    loading: false,
    error: null,

    fetchIssues: async () => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get('/api/v1/issue/all');
            set({ issues: response.data, loading: false });
        } catch (e) {
            console.error('Error fetching issues:', e);
            set({ error: "Failed to fetch issues", loading: false });
        }
    },

    // ZMIANA: addIssue → createIssue
    createIssue: async (issueData) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post('/api/v1/issue/create', issueData);
            set((state) => ({
                issues: [...state.issues, response. data],
                loading: false
            }));
            return response. data;
        } catch (e) {
            console.error('Error creating issue:', e);
            set({ error: "Failed to add issue", loading: false });
            throw e;
        }
    },

    deleteIssue: async (id) => {
        try {
            await apiClient.delete(`/api/v1/issue/${id}`);
            set((state) => ({
                issues:  state.issues.filter(i => i.id !== id)
            }));
        } catch (e) {
            console.error('Error deleting issue:', e);
            throw e;
        }
    },

    updateIssueStatus: async (issueId, newStatus) => {
        const issue = get().issues.find(i => i.id === Number(issueId));
        try {
            await apiClient.put('/api/v1/issue/update', {
                IssueId: Number(issueId),
                Title: issue?.title || null,
                Description: issue?.description?.trim() || null,
                Status: newStatus,
                Priority: issue?.priority || null,
                TeamId: issue?.team?.id || null,
                ProjectId: issue?.projectId || null,
                DueDate: issue?.dueDate ? issue.dueDate.slice(0, 10) : null,
                AssigneeId: issue?.assigneeId || null,
            });

            set((state) => ({
                issues: state.issues.map(i =>
                    i.id === Number(issueId) ? { ...i, status: newStatus } : i
                )
            }));

            return true;
        } catch (e) {
            console.error('Error updating issue status:', e);
            throw e;
        }
    },
}));