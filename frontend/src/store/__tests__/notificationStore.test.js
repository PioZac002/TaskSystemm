import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fetchMine: vi.fn(),
    markAsRead: vi.fn(),
    toastInfo: vi.fn(),
    toastError: vi.fn(),
}));

vi.mock("@/services/apiClient", () => ({
    API_BASE_URL: "http://localhost:6901",
    default: {},
}));

vi.mock("@/services/notificationApi", () => ({
    notificationApi: {
        fetchMine: mocks.fetchMine,
        markAsRead: mocks.markAsRead,
    },
}));

vi.mock("sonner", () => ({
    toast: {
        info: mocks.toastInfo,
        error: mocks.toastError,
    },
}));

vi.mock("@microsoft/signalr", () => ({
    HubConnectionState: { Disconnected: "Disconnected" },
    LogLevel: { Warning: 2 },
    HubConnectionBuilder: vi.fn(() => ({
        withUrl: vi.fn().mockReturnThis(),
        withAutomaticReconnect: vi.fn().mockReturnThis(),
        configureLogging: vi.fn().mockReturnThis(),
        build: vi.fn(() => ({
            state: "Disconnected",
            on: vi.fn(),
            onreconnecting: vi.fn(),
            onreconnected: vi.fn(),
            onclose: vi.fn(),
            start: vi.fn().mockResolvedValue(undefined),
            stop: vi.fn().mockResolvedValue(undefined),
        })),
    })),
}));

async function getNotificationStore() {
    const { useNotificationStore } = await import("@/store/notificationStore");
    useNotificationStore.setState({
        notifications: [],
        totalCount: 0,
        loading: false,
        error: null,
        connected: false,
    });
    return useNotificationStore;
}

describe("notificationStore", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem("accessToken", "token");
        sessionStorage.setItem("userId", "4");
    });

    it("normalizes PascalCase payloads and keeps only notifications for the current user", async () => {
        const useNotificationStore = await getNotificationStore();

        useNotificationStore.getState().addNotifications([
            {
                ID: 11,
                UserId: 4,
                EventAuthorId: 1,
                IssueID: 22,
                Key: "TS-22",
                Type: "ISSUE_ASSIGNED",
                IsRead: "false",
                CreatedAt: "2026-06-05T20:00:00Z",
                Properties: { AssignedById: "1" },
            },
            {
                Id: 12,
                UserId: 7,
                EventAuthorId: 1,
                IssueId: 23,
                Key: "TS-23",
                Type: "ISSUE_ASSIGNED",
                IsRead: false,
                CreatedAt: "2026-06-05T20:01:00Z",
            },
        ]);

        const notifications = useNotificationStore.getState().notifications;
        expect(notifications).toHaveLength(1);
        expect(notifications[0]).toMatchObject({
            id: 11,
            userId: 4,
            eventAuthorId: 1,
            issueId: 22,
            key: "TS-22",
            type: "ISSUE_ASSIGNED",
            isRead: false,
        });
    });

    it("normalizes notification identifiers from properties", async () => {
        const useNotificationStore = await getNotificationStore();

        useNotificationStore.getState().addNotifications({
            Type: "ISSUE_ASSIGNED",
            Properties: {
                NotificationID: 13,
                UserId: 4,
                IssueID: 23,
                IssueKey: "TS-23",
            },
        });

        expect(useNotificationStore.getState().notifications[0]).toMatchObject({
            id: 13,
            userId: 4,
            issueId: 23,
            key: "TS-23",
        });
    });

    it("uses the normalized id when marking a notification as read", async () => {
        mocks.markAsRead.mockResolvedValue({});
        const useNotificationStore = await getNotificationStore();

        useNotificationStore.getState().addNotifications({
            Id: 15,
            UserId: 4,
            IssueId: 30,
            Type: "ISSUE_ASSIGNED",
            IsRead: false,
        });

        await useNotificationStore.getState().markAsRead(15);

        expect(mocks.markAsRead).toHaveBeenCalledWith(15);
        expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it("filters fetched unread notifications to the current user", async () => {
        mocks.fetchMine.mockResolvedValue({
            items: [
                { id: 20, userId: 4, issueId: 40, type: "ISSUE_ASSIGNED", isRead: false },
                { id: 21, userId: 9, issueId: 41, type: "ISSUE_ASSIGNED", isRead: false },
            ],
            totalCount: 2,
        });

        const useNotificationStore = await getNotificationStore();
        await useNotificationStore.getState().fetchNotifications({ qty: 10, unread: true });

        expect(mocks.fetchMine).toHaveBeenCalledWith({ qty: 10, unread: true });
        expect(useNotificationStore.getState().notifications).toHaveLength(1);
        expect(useNotificationStore.getState().notifications[0].id).toBe(20);
        expect(useNotificationStore.getState().totalCount).toBe(1);
    });

    it("keeps realtime unread notifications when a later fetch returns no items", async () => {
        mocks.fetchMine.mockResolvedValue({
            items: [],
            totalCount: 0,
        });

        const useNotificationStore = await getNotificationStore();
        useNotificationStore.getState().addNotifications({
            id: 30,
            userId: 4,
            issueId: 50,
            type: "ISSUE_ASSIGNED",
            isRead: false,
            createdAt: "2026-06-05T20:30:00Z",
        });

        await useNotificationStore.getState().fetchNotifications({ qty: 10, unread: true });

        expect(useNotificationStore.getState().notifications).toHaveLength(1);
        expect(useNotificationStore.getState().notifications[0].id).toBe(30);
    });

    it("restores locally cached realtime notifications after a fresh store fetch returns no content", async () => {
        mocks.fetchMine.mockResolvedValue("");
        let useNotificationStore = await getNotificationStore();

        useNotificationStore.getState().addNotifications({
            userId: 4,
            issueId: 90,
            key: "TS-90",
            type: "ISSUE_ASSIGNED",
            isRead: false,
            createdAt: "2026-06-05T20:40:00Z",
        });

        vi.resetModules();
        useNotificationStore = await getNotificationStore();
        await useNotificationStore.getState().fetchNotifications({ qty: 10, unread: true });

        expect(useNotificationStore.getState().notifications).toHaveLength(1);
        expect(useNotificationStore.getState().notifications[0]).toMatchObject({
            issueId: 90,
            key: "TS-90",
        });
    });

    it("does not re-add a notification after markAsRead when a stale unread fetch returns it again", async () => {
        mocks.markAsRead.mockResolvedValue({});
        mocks.fetchMine.mockResolvedValue({
            items: [
                { id: 40, userId: 4, issueId: 60, type: "ISSUE_ASSIGNED", isRead: false },
            ],
            totalCount: 1,
        });

        const useNotificationStore = await getNotificationStore();
        useNotificationStore.getState().addNotifications({
            id: 40,
            userId: 4,
            issueId: 60,
            type: "ISSUE_ASSIGNED",
            isRead: false,
        });

        await useNotificationStore.getState().markAsRead({
            id: 40,
            userId: 4,
            issueId: 60,
            type: "ISSUE_ASSIGNED",
            isRead: false,
        });
        await useNotificationStore.getState().fetchNotifications({ qty: 10, unread: true });

        expect(mocks.markAsRead).toHaveBeenCalledWith(40);
        expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it("resolves a missing realtime notification id from unread notifications before marking as read", async () => {
        mocks.markAsRead.mockResolvedValue({});
        mocks.fetchMine.mockResolvedValue({
            items: [
                { id: 55, userId: 4, issueId: 75, key: "TS-75", type: "ISSUE_ASSIGNED", isRead: false },
            ],
            totalCount: 1,
        });

        const useNotificationStore = await getNotificationStore();
        useNotificationStore.getState().addNotifications({
            userId: 4,
            issueId: 75,
            key: "TS-75",
            type: "ISSUE_ASSIGNED",
            isRead: false,
        });

        const notification = useNotificationStore.getState().notifications[0];
        expect(notification.id).toBeNull();

        await useNotificationStore.getState().markAsRead(notification);

        expect(mocks.fetchMine).toHaveBeenCalledWith({ qty: 20, unread: true });
        expect(mocks.markAsRead).toHaveBeenCalledWith(55);
        expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it("marks a local-only realtime notification as read when unread fetch returns no content", async () => {
        mocks.fetchMine.mockResolvedValue("");

        const useNotificationStore = await getNotificationStore();
        useNotificationStore.getState().addNotifications({
            userId: 4,
            issueId: 77,
            key: "TS-77",
            type: "ISSUE_ASSIGNED",
            isRead: false,
        });

        const notification = useNotificationStore.getState().notifications[0];
        await useNotificationStore.getState().markAsRead(notification);

        expect(mocks.fetchMine).toHaveBeenCalledWith({ qty: 20, unread: true });
        expect(mocks.markAsRead).not.toHaveBeenCalled();
        expect(mocks.toastError).not.toHaveBeenCalled();
        expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it("shows a new assignment notification for the same issue after an older local notification was marked read", async () => {
        mocks.fetchMine.mockResolvedValue("");

        const useNotificationStore = await getNotificationStore();
        useNotificationStore.getState().addNotifications({
            userId: 4,
            issueId: 77,
            key: "TS-77",
            type: "ISSUE_ASSIGNED",
            isRead: false,
            createdAt: "2026-06-05T20:40:00Z",
        });

        await useNotificationStore.getState().markAsRead(useNotificationStore.getState().notifications[0]);

        useNotificationStore.getState().addNotifications({
            userId: 4,
            issueId: 77,
            key: "TS-77",
            type: "ISSUE_ASSIGNED",
            isRead: false,
            createdAt: "2026-06-05T20:45:00Z",
        });

        expect(useNotificationStore.getState().notifications).toHaveLength(1);
        expect(useNotificationStore.getState().notifications[0].createdAt).toBe("2026-06-05T20:45:00Z");
    });

    it("treats notification id 0 as missing and resolves the real id before marking as read", async () => {
        mocks.markAsRead.mockResolvedValue({});
        mocks.fetchMine.mockResolvedValue({
            items: [
                { id: 66, userId: 4, issueId: 80, key: "TS-80", type: "ISSUE_ASSIGNED", isRead: false },
            ],
            totalCount: 1,
        });

        const useNotificationStore = await getNotificationStore();
        useNotificationStore.getState().addNotifications({
            id: 0,
            userId: 4,
            issueId: 80,
            key: "TS-80",
            type: "ISSUE_ASSIGNED",
            isRead: false,
        });

        const notification = useNotificationStore.getState().notifications[0];
        expect(notification.id).toBeNull();

        await useNotificationStore.getState().markAsRead(notification);

        expect(mocks.markAsRead).toHaveBeenCalledWith(66);
        expect(mocks.markAsRead).not.toHaveBeenCalledWith(0);
        expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
});
