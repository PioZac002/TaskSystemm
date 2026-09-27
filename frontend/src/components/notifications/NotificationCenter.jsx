import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Circle, ExternalLink, Inbox, Loader2, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { useNotificationStore } from "@/store/notificationStore";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

let activeBridgeInstances = 0;
let scheduledDisconnect = null;

function prettifyType(type) {
    const text = String(type || "notification").replaceAll("_", " ").toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function pickProperty(properties, keys) {
    const entries = Object.entries(properties || {});

    for (const key of keys) {
        const directValue = properties?.[key];
        if (directValue !== undefined && directValue !== null && directValue !== "") return directValue;

        const found = entries.find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase());
        if (found?.[1] !== undefined && found[1] !== null && found[1] !== "") return found[1];
    }
    return null;
}

function getUserDisplayName(user) {
    if (!user) return null;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return fullName || user.email || user.username || user.name || null;
}

function getUserName(users, userId) {
    if (userId === undefined || userId === null || userId === "") return null;
    const user = users.find((item) => String(item.id) === String(userId) || String(item.userId) === String(userId));
    return getUserDisplayName(user);
}

function isNumericValue(value) {
    return /^\d+$/.test(String(value || "").trim());
}

function resolveUserReference(users, value) {
    if (value === undefined || value === null || value === "") return null;
    if (!isNumericValue(value)) return String(value);
    return getUserName(users, value);
}

function getNotificationCopy(notification, users = []) {
    const properties = notification.properties || {};
    const type = String(notification.type || "").toUpperCase();
    const issueKey = notification.key || pickProperty(properties, ["key", "issueKey", "IssueKey"]);
    const authorName = pickProperty(properties, ["authorName", "eventAuthorName"]);
    const assignedBy = pickProperty(properties, ["assignedBy", "AssignedBy", "assignedById", "AssignedById"]);
    const author = authorName || resolveUserReference(users, assignedBy) || getUserName(users, notification.eventAuthorId);
    const message = pickProperty(properties, ["message", "Message", "title", "Title", "issueTitle", "IssueTitle", "description"]);

    if (type.includes("ASSIGN")) {
        return {
            title: "Ticket assigned",
            description: `${author ? `${author} assigned` : "Assigned"} ${issueKey || "a ticket"} to you.`,
        };
    }

    return {
        title: prettifyType(notification.type),
        description: message || (issueKey ? `New activity on ${issueKey}.` : "New workspace notification."),
    };
}

function prettifyPropertyKey(key) {
    return String(key || "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replaceAll("_", " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^./, (letter) => letter.toUpperCase());
}

function isUserReferenceKey(key) {
    return /(user|author|assignee|assigned|recipient)/i.test(String(key || ""));
}

function shouldHideProperty(key) {
    const normalized = String(key || "").toLowerCase();
    return [
        "id",
        "key",
        "issuekey",
        "issueid",
        "userid",
        "eventauthorid",
        "authorid",
        "assigneeid",
        "assignedbyid",
        "assignedtoid",
        "recipientuserid",
        "projectid",
        "teamid",
        "message",
        "title",
        "issuetitle",
        "description",
    ].includes(normalized);
}

function getDisplayProperties(notification, users, limit) {
    return Object.entries(notification.properties || {})
        .map(([key, value]) => {
            if (shouldHideProperty(key)) return null;

            const resolvedValue = isUserReferenceKey(key) && isNumericValue(value)
                ? getUserName(users, value)
                : value;

            if (resolvedValue === undefined || resolvedValue === null || resolvedValue === "") return null;

            return {
                key,
                label: prettifyPropertyKey(key),
                value: String(resolvedValue),
            };
        })
        .filter(Boolean)
        .slice(0, limit);
}

function formatCreatedAt(createdAt) {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function NotificationRow({ notification, users = [], compact = false }) {
    const navigate = useNavigate();
    const markAsRead = useNotificationStore((state) => state.markAsRead);
    const copy = getNotificationCopy(notification, users);
    const createdAt = formatCreatedAt(notification.createdAt);
    const issueHref = notification.issueId ? `/issues/${notification.issueId}` : null;
    const properties = getDisplayProperties(notification, users, compact ? 1 : 2);

    const handleOpenIssue = () => {
        if (!issueHref) return;
        navigate(issueHref);
    };

    return (
        <article
            className={cn(
                "notification-card group rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm transition-all",
                issueHref && "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold leading-5">{copy.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {copy.description}
                            </p>
                        </div>
                        <Circle className="mt-1 h-2 w-2 shrink-0 fill-primary text-primary" />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {notification.key && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                                {notification.key}
                            </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                            {prettifyType(notification.type)}
                        </Badge>
                        {createdAt && (
                            <span className="text-[11px] text-muted-foreground">{createdAt}</span>
                        )}
                    </div>

                    {properties.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {properties.map((property) => (
                                <p key={property.key} className="truncate text-[11px] text-muted-foreground">
                                    <span className="font-medium text-foreground/70">{property.label}:</span> {property.value}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                        {issueHref && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenIssue();
                                }}
                            >
                                Open issue
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            onClick={(event) => {
                                event.stopPropagation();
                                markAsRead(notification);
                            }}
                        >
                            <Check className="h-3.5 w-3.5" />
                            Mark read
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}

function NotificationList({ compact = false, className }) {
    const notifications = useNotificationStore((state) => state.notifications);
    const loading = useNotificationStore((state) => state.loading);
    const connected = useNotificationStore((state) => state.connected);
    const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
    const users = useUserStore((state) => state.users);
    const fetchUsers = useUserStore((state) => state.fetchUsers);

    useEffect(() => {
        if (users.length === 0) fetchUsers();
    }, [fetchUsers, users.length]);

    const visibleNotifications = useMemo(
        () => notifications.filter((item) => !item.isRead).slice(0, compact ? 6 : 4),
        [notifications, compact]
    );

    return (
        <div className={cn("rounded-lg border border-border bg-popover text-popover-foreground shadow-xl", className)}>
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                    <p className="text-sm font-semibold">Notifications</p>
                    <p className="text-xs text-muted-foreground">Unread assignment events</p>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium",
                            connected ? "border-emerald-500/30 text-emerald-600" : "border-border text-muted-foreground"
                        )}
                    >
                        {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        Live
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => fetchNotifications({ qty: 10, unread: true })}
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
                    </Button>
                </div>
            </div>

            <div className={cn("max-h-[28rem] overflow-y-auto p-3", compact && "max-h-[70vh]")}>
                {loading && visibleNotifications.length === 0 ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
                        ))}
                    </div>
                ) : visibleNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <Inbox className="h-8 w-8 text-muted-foreground/35" />
                        <p className="text-sm font-medium">No unread notifications</p>
                        <p className="max-w-56 text-xs text-muted-foreground">
                            New ticket assignments will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visibleNotifications.map((notification) => (
                            <NotificationRow
                                key={notification.id ?? `${notification.type}-${notification.createdAt}`}
                                notification={notification}
                                users={users}
                                compact={compact}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function NotificationRealtimeBridge() {
    const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
    const connectRealtime = useNotificationStore((state) => state.connectRealtime);
    const disconnectRealtime = useNotificationStore((state) => state.disconnectRealtime);

    useEffect(() => {
        activeBridgeInstances += 1;

        if (scheduledDisconnect) {
            clearTimeout(scheduledDisconnect);
            scheduledDisconnect = null;
        }

        fetchNotifications({ qty: 10, unread: true });
        connectRealtime();

        return () => {
            activeBridgeInstances = Math.max(0, activeBridgeInstances - 1);

            scheduledDisconnect = window.setTimeout(() => {
                if (activeBridgeInstances === 0) {
                    disconnectRealtime();
                }
                scheduledDisconnect = null;
            }, 3000);
        };
    }, [connectRealtime, disconnectRealtime, fetchNotifications]);

    return null;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const unreadCount = useNotificationStore((state) => state.notifications.filter((item) => !item.isRead).length);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(calc(100vw-1rem),24rem)] p-0">
                <NotificationList compact />
            </PopoverContent>
        </Popover>
    );
}

export function DesktopNotificationDock() {
    const unreadCount = useNotificationStore((state) => state.notifications.filter((item) => !item.isRead).length);

    if (unreadCount === 0) return null;

    return (
        <div className="notification-dock pointer-events-none fixed bottom-4 right-4 z-40 hidden w-[360px] max-w-[calc(100vw-2rem)] md:block">
            <NotificationList className="pointer-events-auto" />
        </div>
    );
}
