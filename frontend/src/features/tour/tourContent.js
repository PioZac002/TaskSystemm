import { storageService } from "@/services/storageService";

/**
 * Content and bookkeeping for the guided walkthrough; the UI lives in ProductTour.jsx (kept separate so the two module names no longer differ only by case).
 * Steps whose element is missing on the current screen (e.g. the layout switch on
 * phones) are dropped instead of pointing at nothing.
 */

const SEEN_KEY_PREFIX = "tour_seen";
const DEMO_SESSION_KEY = "demoSession";

export const seenKeyFor = (userId) => `${SEEN_KEY_PREFIX}:${userId || "anonymous"}`;

export function isDemoSession() {
    return storageService.getItem(DEMO_SESSION_KEY) === "true";
}

export function markDemoSession() {
    storageService.setItem(DEMO_SESSION_KEY, "true");
}

export function hasSeenTour(userId) {
    try {
        return localStorage.getItem(seenKeyFor(userId)) === "true";
    } catch {
        return true; // no storage: never nag
    }
}

export function markTourSeen(userId) {
    try {
        localStorage.setItem(seenKeyFor(userId), "true");
    } catch {
        // Storage unavailable: the tour simply offers itself again next time
    }
}

const STEPS = [
    {
        title: "Welcome to TaskSystem",
        description:
            "A quick tour of the workspace: where your own work lives, how issues move, and what the numbers mean. Use the arrow keys or the buttons, and press Esc to leave at any point.",
    },
    {
        element: "[data-tour='hud']",
        title: "Your run at a glance",
        description:
            "Open issues assigned to you, how many are due within seven days, how many are overdue, how many wait on another team or sit in review, plus the workspace completion bar.",
    },
    {
        element: "[data-tour='your-issues']",
        title: "Your queue",
        description:
            "Issues assigned to you. Each row shows its stage glyph, project key (like WEB-4), priority and due date. Overdue rows flash red once and keep a red date. Click a title to open it, or the eye to peek without leaving the page.",
    },
    {
        element: "[data-tour='stages']",
        title: "Every stage of the workflow",
        description:
            "All issues in the workspace by stage: New, Triage, To Do, In Progress, Waiting for Team, Code Review, Done and Canceled. Each stage owns one color and one glyph, so waiting work never hides inside 'in progress'.",
    },
    {
        element: "[data-tour='your-projects']",
        title: "Projects you own",
        description: "Progress per project: how many of its issues are done, drawn as a segmented bar.",
    },
    {
        element: "[data-tour='recent-projects']",
        title: "Project cards",
        description:
            "Recently created projects with their done, active and to-do counts. Click a card to flip it and see the issues inside.",
    },
    {
        element: "[data-tour='mode-switch']",
        title: "Three dashboard layouts",
        description:
            "Default is this view. Custom lets you pick, reorder and resize widgets, including charts. Jira-like opens issues in a side panel instead of a page. Arrow keys move between them.",
    },
    {
        element: "[data-tour='new-issue']",
        title: "File an issue",
        description:
            "New issues get the next key in their project and start in New. The button next to it creates a whole project.",
    },
    {
        element: "[data-tour='nav']",
        title: "The rest of the app",
        description:
            "Board is where work actually moves: drag cards between columns, in three grouped lanes or all eight. Issues is the full list with filters, Projects and Teams manage who works on what.",
    },
    {
        element: "[data-tour='search']",
        title: "Search everything",
        description: "Find any project or issue by name or key, then jump straight to it.",
    },
    {
        element: "[data-tour='theme']",
        title: "Two materials",
        description: "Switch between the phosphor screen (dark) and the printed instruction card (light). The choice is remembered.",
    },
];

const DEMO_CLOSING = {
    title: "It's a sandbox",
    description:
        "This is the demo account, filled with sample projects and issues. Change anything you like: drag cards, comment, close issues. Start the tour again any time with the Guide button.",
};

/** Steps that actually have something to point at on this screen. */
export function tourStepsForScreen({ demo = false } = {}) {
    const steps = STEPS.filter((step) => !step.element || document.querySelector(step.element));
    return demo ? [...steps, DEMO_CLOSING] : steps;
}
