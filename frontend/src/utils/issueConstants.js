export const STATUS_LABELS = {
    NEW: "New",
    TRIAGE: "Triage",
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    WAITING_FOR_TEAM: "Waiting for Team",
    CODE_REVIEW: "Code Review",
    DONE: "Done",
    CANCELED: "Canceled",
};

export const PRIORITY_LABELS = {
    LOW: "Low",
    NORMAL: "Normal",
    HIGH: "High",
    CRITICAL: "Critical",
};

export const ALL_STATUSES = ["NEW", "TRIAGE", "TODO", "IN_PROGRESS", "WAITING_FOR_TEAM", "CODE_REVIEW", "DONE", "CANCELED"];
export const ALL_PRIORITIES = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

// Status sprite colors live as CSS tokens (src/styles/arcade.css) so both themes stay legible
export const STATUS_COLORS = {
    NEW: "var(--st-new)",
    TRIAGE: "var(--st-triage)",
    TODO: "var(--st-todo)",
    IN_PROGRESS: "var(--st-progress)",
    WAITING_FOR_TEAM: "var(--st-waiting)",
    CODE_REVIEW: "var(--st-review)",
    DONE: "var(--st-done)",
    CANCELED: "var(--st-canceled)",
};

export const getStatusBadgeClass = (status) => `st-chip st-${ALL_STATUSES.includes(status) ? status : "NEW"}`;

export const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
        case "CRITICAL": return "destructive";
        case "HIGH": return "destructive";
        case "NORMAL": return "secondary";
        case "LOW": return "outline";
        default: return "secondary";
    }
};

export const getPriorityBadgeClass = (priority) => {
    if (priority === "CRITICAL") return "font-semibold";
    if (priority === "HIGH") return "";
    return "";
};
