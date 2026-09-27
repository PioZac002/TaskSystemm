import { create } from "zustand";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import { API_ORIGIN } from "@/services/apiBase";
import { notificationApi } from "@/services/notificationApi";
import { storageService } from "@/services/storageService";

const HUB_METHODS = [
    "ReceiveNotification",
    "Notification",
    "notification",
    "SendNotification",
    "ReceiveMessage",
];

const NOTIFICATION_CACHE_PREFIX = "tasksystem.notifications.unread";
const NOTIFICATION_READ_CACHE_PREFIX = "tasksystem.notifications.read";

let connection = null;
let startingPromise = null;
let activeToken = null;
let stoppingIntentionally = false;
const locallyReadNotificationKeys = new Set();

function pickValue(source, keys) {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== "") return value;
    }
    return null;
}

function parseStoredJson(value) {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function decodeJwtPayload(token) {
    if (!token) return null;

    try {
        const payload = token.split(".")[1];
        if (!payload) return null;

        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
}

function getCurrentUserId() {
    const storedUserId = storageService.getItem("userId");
    if (storedUserId) return String(storedUserId);

    const storedUser = parseStoredJson(storageService.getItem("user"));
    const userId = pickValue(storedUser, ["id", "userId", "UserId"]);
    if (userId !== null) return String(userId);

    const tokenPayload = decodeJwtPayload(storageService.getItem("accessToken"));
    const tokenUserId = pickValue(tokenPayload, [
        "sub",
        "userId",
        "nameid",
        "id",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier",
    ]);

    return tokenUserId !== null ? String(tokenUserId) : null;
}

function getUserScopedStorageKey(prefix) {
    return `${prefix}:${getCurrentUserId() || "anonymous"}`;
}

function readLocalJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeLocalJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Local cache is best-effort only.
    }
}

function toBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes"].includes(normalized)) return true;
        if (["false", "0", "no"].includes(normalized)) return false;
    }

    return Boolean(value);
}

function normalizeNotificationId(value) {
    if (value === undefined || value === null || value === "") return null;

    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue <= 0) return null;

    return numericValue;
}

function normalizeNotification(notification) {
    if (!notification || typeof notification !== "object") return null;

    const properties = pickValue(notification, ["properties", "Properties"]) || {};

    return {
        id: normalizeNotificationId(
            pickValue(notification, ["id", "Id", "ID", "notificationId", "NotificationId", "NotificationID"])
            ?? pickValue(properties, ["id", "Id", "ID", "notificationId", "NotificationId", "NotificationID"])
        ),
        userId: pickValue(notification, ["userId", "UserId", "recipientUserId", "RecipientUserId"])
            ?? pickValue(properties, ["userId", "UserId", "recipientUserId", "RecipientUserId"]),
        eventAuthorId: pickValue(notification, ["eventAuthorId", "EventAuthorId", "authorId", "AuthorId"])
            ?? pickValue(properties, ["eventAuthorId", "EventAuthorId", "authorId", "AuthorId"]),
        issueId: pickValue(notification, ["issueId", "IssueId", "IssueID"])
            ?? pickValue(properties, ["issueId", "IssueId", "IssueID"]),
        key: pickValue(notification, ["key", "Key"])
            ?? pickValue(properties, ["key", "Key", "issueKey", "IssueKey"]),
        type: pickValue(notification, ["type", "Type"]) ?? pickValue(properties, ["type", "Type"]) ?? "NOTIFICATION",
        isRead: toBoolean((pickValue(notification, ["isRead", "IsRead"]) ?? pickValue(properties, ["isRead", "IsRead"])) ?? false),
        createdAt: pickValue(notification, ["createdAt", "CreatedAt"]) ?? pickValue(properties, ["createdAt", "CreatedAt"]) ?? new Date().toISOString(),
        properties: properties && typeof properties === "object" && !Array.isArray(properties) ? properties : {},
    };
}

function getNotificationIdentity(notification) {
    if (!notification) return null;
    const notificationId = normalizeNotificationId(notification.id);
    if (notificationId !== null) {
        return `id:${notificationId}`;
    }

    const type = notification.type || "NOTIFICATION";
    const recipient = notification.userId || getCurrentUserId() || "unknown-user";
    const target = notification.issueId || notification.key;
    const createdAt = notification.createdAt || "unknown";

    if (target !== undefined && target !== null && target !== "") {
        return `local:${type}:${recipient}:${target}:${createdAt}`;
    }

    return `local:${type}:${recipient}:${createdAt}`;
}

function getPersistedReadKeys() {
    return new Set(readLocalJson(getUserScopedStorageKey(NOTIFICATION_READ_CACHE_PREFIX), []));
}

function persistReadKeys(keys) {
    writeLocalJson(getUserScopedStorageKey(NOTIFICATION_READ_CACHE_PREFIX), Array.from(keys).slice(-200));
}

function rememberReadNotification(notificationOrKey) {
    const key = typeof notificationOrKey === "string"
        ? notificationOrKey
        : getNotificationIdentity(notificationOrKey);

    if (!key) return null;

    const keys = getPersistedReadKeys();
    keys.add(key);
    locallyReadNotificationKeys.add(key);
    persistReadKeys(keys);

    return key;
}

function forgetReadNotification(key) {
    if (!key) return;

    const keys = getPersistedReadKeys();
    keys.delete(key);
    locallyReadNotificationKeys.delete(key);
    persistReadKeys(keys);
}

function isLocallyRead(notification) {
    const key = getNotificationIdentity(notification);
    if (!key) return false;
    return locallyReadNotificationKeys.has(key) || getPersistedReadKeys().has(key);
}

function unpackNotifications(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload.map(normalizeNotification).filter(Boolean);
    if (Array.isArray(payload.items)) return payload.items.map(normalizeNotification).filter(Boolean);
    if (payload.item) return unpackNotifications(payload.item);
    if (payload.notification) return unpackNotifications(payload.notification);
    return [normalizeNotification(payload)].filter(Boolean);
}

function isNotificationForCurrentUser(notification) {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return true;

    const recipientId = notification.userId
        ?? pickValue(notification.properties, ["userId", "UserId", "recipientUserId", "RecipientUserId"]);

    if (recipientId === undefined || recipientId === null || recipientId === "") return true;

    return String(recipientId) === currentUserId;
}

function filterNotificationsForCurrentUser(notifications) {
    return notifications.filter((notification) => isNotificationForCurrentUser(notification) && !isLocallyRead(notification));
}

function comparable(value) {
    if (value === undefined || value === null || value === "") return null;
    return String(value).trim().toLowerCase();
}

function typesCompatible(first, second) {
    const firstType = comparable(first);
    const secondType = comparable(second);
    if (!firstType || !secondType) return true;
    if (firstType === secondType) return true;
    return firstType.includes("assign") && secondType.includes("assign");
}

function notificationsMatch(first, second) {
    if (!first || !second) return false;

    const firstId = comparable(normalizeNotificationId(first.id));
    const secondId = comparable(normalizeNotificationId(second.id));
    if (firstId && secondId) return firstId === secondId;

    const firstKey = comparable(first.key);
    const secondKey = comparable(second.key);
    if (firstKey && secondKey && firstKey === secondKey && typesCompatible(first.type, second.type)) return true;

    const firstIssueId = comparable(first.issueId);
    const secondIssueId = comparable(second.issueId);
    if (firstIssueId && secondIssueId && firstIssueId === secondIssueId && typesCompatible(first.type, second.type)) return true;

    const firstIdentity = comparable(getNotificationIdentity(first));
    const secondIdentity = comparable(getNotificationIdentity(second));
    return Boolean(firstIdentity && secondIdentity && firstIdentity === secondIdentity);
}

function mergeNotifications(current, incoming) {
    const merged = [];

    for (const item of [...incoming, ...current]) {
        const index = merged.findIndex((existing) => notificationsMatch(existing, item));

        if (index === -1) {
            merged.push(item);
            continue;
        }

        const existing = merged[index];
        merged[index] = {
            ...item,
            ...existing,
            id: existing.id ?? item.id,
            userId: existing.userId ?? item.userId,
            eventAuthorId: existing.eventAuthorId ?? item.eventAuthorId,
            issueId: existing.issueId ?? item.issueId,
            key: existing.key ?? item.key,
            properties: {
                ...(item.properties || {}),
                ...(existing.properties || {}),
            },
        };
    }

    return merged
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 20);
}

function loadPersistedNotifications() {
    const cached = readLocalJson(getUserScopedStorageKey(NOTIFICATION_CACHE_PREFIX), []);
    return Array.isArray(cached) ? filterNotificationsForCurrentUser(cached.map(normalizeNotification).filter(Boolean)) : [];
}

function persistNotifications(notifications) {
    const unread = filterNotificationsForCurrentUser(notifications)
        .filter((notification) => !notification.isRead)
        .slice(0, 20);

    writeLocalJson(getUserScopedStorageKey(NOTIFICATION_CACHE_PREFIX), unread);
}

function notificationTitle(notification) {
    const type = String(notification.type || "notification").replaceAll("_", " ").toLowerCase();
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    return notification.key ? `${label}: ${notification.key}` : label;
}

function buildHubUrl(token) {
    const url = new URL("/notificationHub", `${API_ORIGIN}/`);
    url.searchParams.set("access_token", token);
    return url.toString();
}

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    totalCount: 0,
    loading: false,
    error: null,
    connected: false,

    unreadCount: () => get().notifications.filter((item) => !item.isRead).length,

    fetchNotifications: async ({ qty = 10, unread = true } = {}) => {
        const token = storageService.getItem("accessToken");
        if (!token) return;

        set({ loading: true, error: null });
        try {
            const response = await notificationApi.fetchMine({ qty, unread });
            const items = filterNotificationsForCurrentUser(unpackNotifications(response));
            const persisted = loadPersistedNotifications();
            set((state) => ({
                notifications: mergeNotifications(state.notifications, [...persisted, ...items]),
                totalCount: Math.max(items.length + persisted.length, state.totalCount),
                loading: false,
            }));
            persistNotifications(get().notifications);
        } catch (error) {
            set({
                loading: false,
                error: error.response?.data?.Message || error.message || "Failed to load notifications",
            });
        }
    },

    addNotifications: (payload, { showToast = true } = {}) => {
        const incoming = filterNotificationsForCurrentUser(unpackNotifications(payload));
        if (incoming.length === 0) return;

        set((state) => ({
            notifications: mergeNotifications(state.notifications, incoming),
            totalCount: Math.max(state.totalCount, state.notifications.length + incoming.length),
        }));
        persistNotifications(get().notifications);

        if (showToast) {
            toast.info(notificationTitle(incoming[0]));
        }
    },

    markAsRead: async (id) => {
        const notification = typeof id === "object" ? normalizeNotification(id) : { id };
        let notificationId = normalizeNotificationId(notification?.id);

        const notificationKey = rememberReadNotification(notification);

        const previous = get().notifications;
        set((state) => ({
            notifications: state.notifications.filter((item) => !notificationsMatch(item, notification)),
        }));
        persistNotifications(get().notifications);

        try {
            if (notificationId === null) {
                const response = await notificationApi.fetchMine({ qty: 20, unread: true });
                const match = unpackNotifications(response)
                    .filter(isNotificationForCurrentUser)
                    .find((item) => notificationsMatch(item, notification));

                notificationId = normalizeNotificationId(match?.id);
            }

            if (notificationId === null) {
                return;
            }

            rememberReadNotification(`id:${notificationId}`);
            await notificationApi.markAsRead(notificationId);
        } catch (error) {
            forgetReadNotification(notificationKey);
            if (notificationId !== null) {
                forgetReadNotification(`id:${notificationId}`);
            }
            set({ notifications: previous });
            persistNotifications(previous);
            toast.error(error.response?.data?.Message || error.message || "Failed to mark notification as read");
        }
    },

    connectRealtime: async () => {
        const token = storageService.getItem("accessToken");
        if (!token) return;

        if (connection && activeToken && activeToken !== token) {
            await get().disconnectRealtime();
        }

        if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
            return startingPromise;
        }

        stoppingIntentionally = false;
        activeToken = token;

        connection = new signalR.HubConnectionBuilder()
            .withUrl(buildHubUrl(token))
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        const handleIncoming = (...args) => {
            get().addNotifications(args.length > 1 ? args : args[0]);
        };

        HUB_METHODS.forEach((method) => connection.on(method, handleIncoming));

        connection.onreconnecting(() => set({ connected: false }));
        connection.onreconnected(() => {
            set({ connected: true });
            get().fetchNotifications({ qty: 10, unread: true });
        });
        connection.onclose(() => set({ connected: false }));

        const currentConnection = connection;

        startingPromise = currentConnection
            .start()
            .then(() => set({ connected: true, error: null }))
            .catch((error) => {
                const stoppedDuringNegotiation = String(error?.message || "")
                    .toLowerCase()
                    .includes("stopped during negotiation");

                if (stoppingIntentionally || connection !== currentConnection || stoppedDuringNegotiation) {
                    set({ connected: false });
                    return;
                }

                set({
                    connected: false,
                    error: error.message || "Failed to connect notification hub",
                });
            })
            .finally(() => {
                startingPromise = null;
            });

        return startingPromise;
    },

    disconnectRealtime: async () => {
        if (!connection) {
            set({ connected: false });
            return;
        }

        const current = connection;
        connection = null;
        startingPromise = null;
        activeToken = null;
        stoppingIntentionally = true;

        try {
            await current.stop();
        } finally {
            stoppingIntentionally = false;
            set({ connected: false });
        }
    },
}));
