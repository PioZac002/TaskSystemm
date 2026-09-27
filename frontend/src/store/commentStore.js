import { create } from "zustand";
import apiClient from "@/services/apiClient";
import { fileService } from "@/services/fileService";

export const useCommentStore = create((set, get) => ({
    comments: [],
    loading: false,
    error: null,

    fetchCommentsByIssueId: async (issueId) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get(`/api/v1/comment/issue/${issueId}`);
            set({ comments: response.data, loading: false });
        } catch (e) {
            console.error('Error fetching comments:', e);
            set({ error: e.message || "Failed to fetch comments", loading: false, comments: [] });
        }
    },

    createComment: async (commentData) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post('/api/v1/comment/create', commentData);
            set({
                comments: [...get().comments, response.data],
                loading: false
            });
            return response.data;
        } catch (e) {
            console.error('Error creating comment:', e);
            set({ error: e.message || "Failed to create comment", loading: false });
            throw e;
        }
    },

    deleteComment: async (id) => {
        set({ loading: true, error: null });
        try {
            await apiClient.delete(`/api/v1/comment/${id}`);
            set({
                comments: get().comments.filter(c => c.id !== id),
                loading: false
            });
        } catch (e) {
            console.error('Error deleting comment:', e);
            set({ error: e.message || "Failed to delete comment", loading: false });
            throw e;
        }
    },

    uploadAttachment: async (file, commentId) => {
        try {
            const result = await fileService.uploadFile(file, commentId);
            // Update the comment in the local state to include the new attachment id
            set({
                comments: get().comments.map(c =>
                    c.id === commentId
                        ? { ...c, attachmentIds: [...(c.attachmentIds || []), result.fileId] }
                        : c
                )
            });
            return result;
        } catch (e) {
            console.error('Error uploading attachment:', e);
            throw e;
        }
    },

    editComment: async (id, content) => {
        try {
            const res = await apiClient.put('/api/v1/comment/edit', { id, content });
            set({
                comments: get().comments.map(c =>
                    c.id === id ? { ...c, content, ...(res.data || {}) } : c
                )
            });
            return res.data;
        } catch (e) {
            console.error('Error editing comment:', e);
            throw e;
        }
    },

    deleteAllByIssueId: async (issueId) => {
        try {
            await apiClient.delete(`/api/v1/comment/issue/${issueId}`);
            set({ comments: [] });
        } catch (e) {
            console.error('Error deleting all comments:', e);
            throw e;
        }
    },

    deleteAttachment: async (fileId, commentId) => {
        try {
            await fileService.deleteFile(fileId);
            // Remove the attachment id from the comment in local state
            set({
                comments: get().comments.map(c =>
                    c.id === commentId
                        ? { ...c, attachmentIds: (c.attachmentIds || []).filter(id => id !== fileId) }
                        : c
                )
            });
        } catch (e) {
            console.error('Error deleting attachment:', e);
            throw e;
        }
    },
}));
