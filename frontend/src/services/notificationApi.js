import apiClient from "@/services/apiClient";

export const notificationApi = {
    async fetchMine({ qty = 10, unread = true } = {}) {
        const response = await apiClient.get("/api/v1/notifications/me", {
            params: { qty, unread },
        });
        return response.data;
    },

    async markAsRead(id) {
        const response = await apiClient.put(`/api/v1/notifications/read/${id}`);
        return response.data;
    },
};
