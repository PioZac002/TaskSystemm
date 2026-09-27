import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { ProjectFlipCard } from "@/components/ui/ProjectFlipCard";
import { IssueLabelChips } from "@/components/ui/IssueLabelChips";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/Chart";
import { useProjectStore } from "@/store/projectStore";
import { useIssueStore } from "@/store/issueStore";
import { useUserStore } from "@/store/userStore";
import { useAuthStore } from "@/store/authStore";
import { ProjectDetailsModal } from "@/components/modals/ProjectDetailsModal";
import { IssueDetailsModal } from "@/components/modals/IssueDetailsModal";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { CreateIssueModal } from "@/components/modals/CreateIssueModal";
import { AddButton } from "@/components/ui/AddButton";
import { useResponsiveNavigation } from "@/hooks/useResponsiveNavigation";
import { PriorityMark, PxMeter, StatusGlyph } from "@/components/arcade/StatusGlyph";
import {
    IconArrowDown,
    IconHelp,
    IconArrowRight,
    IconArrowUp,
    IconBoard,
    IconCalendar,
    IconCog,
    IconEye,
    IconFolder,
    IconGrid,
    IconHome,
    IconProgress,
    IconStar,
} from "@/components/arcade/icons";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";
import { ALL_STATUSES, STATUS_COLORS, STATUS_LABELS, PRIORITY_LABELS } from "@/utils/issueConstants";
import { hasSeenTour, isDemoSession, markTourSeen, tourStepsForScreen } from "@/features/tour/tourContent";
import { ProductTour } from "@/features/tour/ProductTour";
import "./dashboard.css";

gsap.registerPlugin(Flip);

const DASHBOARD_MODE_KEY = "dashboard_mode";
const DASHBOARD_WIDGETS_KEY = "dashboard_custom_widgets";
const DASHBOARD_CHART_PREFS_KEY = "dashboard_chart_prefs";
const DASHBOARD_LAYOUT_KEY = "dashboard_widget_layout";

const DEFAULT_CUSTOM_WIDGETS = [
    "your-issues",
    "recent-projects",
    "your-projects",
    "issue-status-chart",
    "issue-priority-chart",
    "issue-trend-chart",
    "project-progress-chart",
];

const CUSTOM_WIDGET_OPTIONS = [
    { id: "your-issues", label: "Your Issues" },
    { id: "recent-projects", label: "Recent Projects & Issues" },
    { id: "your-projects", label: "Your Projects" },
    { id: "issue-status-chart", label: "Issue Status Chart" },
    { id: "issue-priority-chart", label: "Issue Priority Chart" },
    { id: "issue-trend-chart", label: "Issue Trend Chart" },
    { id: "project-progress-chart", label: "Project Progress Chart" },
];

const DEFAULT_CHART_PREFS = {
    projectId: "all",
    issueStatusVariant: "pie",
    issuePriorityVariant: "bar",
    issueTrendVariant: "line",
};

const DEFAULT_WIDGET_LAYOUT = {
    "your-issues": "full",
    "recent-projects": "full",
    "your-projects": "half",
    "issue-status-chart": "half",
    "issue-priority-chart": "half",
    "issue-trend-chart": "half",
    "project-progress-chart": "full",
};

const MODE_OPTIONS = [
    { value: "default", label: "Default", icon: IconHome },
    { value: "custom", label: "Custom", icon: IconGrid },
    { value: "jira", label: "Jira-like", icon: IconBoard },
];

const PRIORITY_COLORS = { LOW: "var(--st-new)", NORMAL: "var(--st-progress)", HIGH: "var(--st-waiting)", CRITICAL: "var(--st-canceled)" };
const DAY_MS = 24 * 60 * 60 * 1000;
const HUD_TICK = { fontFamily: "Silkscreen, monospace", fontSize: 10, fill: "var(--color-muted-foreground)" };

const getUserScopedStorageKey = (prefix, userId) => `${prefix}:${userId || "anonymous"}`;

function safeReadJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

function formatDate(dateString) {
    if (!dateString) return null;
    return shortDate.format(new Date(dateString));
}

function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function greetingFor(date) {
    const hour = date.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

// ─── Building blocks ───────────────────────────────────────────────────────────

function WidgetShell({ title, count, action, children, plain = false, className, tourId }) {
    return (
        <section className={cn("flex h-full min-w-0 flex-col", className)} data-tour={tourId}>
            <header className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="flex min-w-0 items-baseline gap-2.5">
                    <h2 className="truncate text-xl leading-none">{title}</h2>
                    {count != null && <span className="px-num text-xs text-muted-foreground">{count}</span>}
                </div>
                {action}
            </header>
            <div className={cn("min-w-0 flex-1", !plain && "border-2 border-border bg-card")}>{children}</div>
        </section>
    );
}

function HeaderLink({ to, children }) {
    return (
        <Link to={to} className="dash-link hud inline-flex min-h-9 items-center gap-1.5 px-1 text-[0.6875rem] text-muted-foreground">
            {children}
            <IconArrowRight width={14} height={14} aria-hidden="true" />
        </Link>
    );
}

function EmptyState({ icon, title, hint }) {
    const EmptyIcon = icon || IconStar;
    return (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <EmptyIcon width={24} height={24} aria-hidden="true" className="text-muted-foreground" />
            <p className="font-pixel text-lg font-bold">{title}</p>
            {hint && <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>}
        </div>
    );
}

// Cabinet menu: arrow keys move the pixel cursor between layouts
function ModeSwitch({ value, onChange }) {
    const index = Math.max(0, MODE_OPTIONS.findIndex((mode) => mode.value === value));

    const handleKeyDown = (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : -1;
        const next = MODE_OPTIONS[(index + step + MODE_OPTIONS.length) % MODE_OPTIONS.length];
        onChange(next.value);
        event.currentTarget.querySelector(`[data-mode="${next.value}"]`)?.focus();
    };

    return (
        <div role="radiogroup" aria-label="Dashboard layout" data-tour="mode-switch" onKeyDown={handleKeyDown} className="px-chamfer flex border-2 border-border bg-card p-0.5">
            {MODE_OPTIONS.map((mode) => {
                const active = value === mode.value;
                return (
                    <button
                        key={mode.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        data-mode={mode.value}
                        onClick={() => onChange(mode.value)}
                        className={cn("dash-mode hud flex h-8 items-center gap-1.5 whitespace-nowrap px-2.5 text-[0.6875rem]", active && "is-active")}
                    >
                        <IconProgress width={12} height={12} aria-hidden="true" className="dash-cursor" />
                        {mode.label}
                    </button>
                );
            })}
        </div>
    );
}

const pad2 = (n) => String(n).padStart(2, "0");

// One cabinet HUD strip: caps label + score readout, colored by meaning
function HudBar({ items }) {
    return (
        <dl data-tour="hud" className="mb-10 grid grid-cols-2 gap-[2px] border-2 border-border bg-border sm:grid-cols-4 lg:flex">
            {items.map((item) => (
                <div
                    key={item.label}
                    className={cn(
                        "flex min-w-0 items-baseline gap-2.5 bg-card px-4 py-3",
                        item.wide && "col-span-2",
                        item.grow && "col-span-2 sm:col-span-4 lg:flex-1"
                    )}
                >
                    <dt className="hud shrink-0 text-[0.625rem] text-muted-foreground">{item.label}</dt>
                    <dd className={cn("flex min-w-0 items-center gap-3", item.grow && "flex-1", item.tone)}>
                        <span className={cn("px-num leading-none", item.text ? "truncate text-base" : "text-2xl")}>{item.value}</span>
                        {item.meter != null && <PxMeter value={item.meter} className="min-w-16 flex-1" label={item.label} color="var(--px-gold)" />}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function IssueRow({ issue, jiraLike, onOpenPanel, flash }) {
    const dueTime = issue.dueDate ? new Date(issue.dueDate).getTime() : null;
    const overdue = dueTime != null && dueTime < startOfToday() && issue.status !== "DONE";

    return (
        <li className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t-2 border-border px-4 py-3 first:border-t-0", `st-${issue.status}`, flash ? "px-flash" : overdue && "px-flash-red relative")}>
            <span className="dash-glyph grid h-9 w-9 place-items-center border-2" title={STATUS_LABELS[issue.status]}>
                <StatusGlyph status={issue.status} size={18} />
            </span>
            <div className="min-w-0">
                <div className="flex min-w-0 items-baseline gap-2">
                    <span className="px-num shrink-0 text-xs text-muted-foreground">{issue.key}</span>
                    {jiraLike ? (
                        <button
                            type="button"
                            title="Open details panel"
                            className="truncate text-left text-[0.9375rem] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => onOpenPanel(issue.id)}
                        >
                            {issue.title}
                        </button>
                    ) : (
                        <Link
                            to={`/issues/${issue.id}`}
                            title="Open full page"
                            className="truncate text-[0.9375rem] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {issue.title}
                        </Link>
                    )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="hud st-ink text-[0.6875rem]">{STATUS_LABELS[issue.status] || issue.status}</span>
                    <PriorityMark priority={issue.priority} />
                    {issue.dueDate && (
                        <span className={cn("hud inline-flex items-center gap-1 text-[0.6875rem]", overdue ? "text-[var(--px-red)]" : "text-muted-foreground")}>
                            <IconCalendar width={12} height={12} aria-hidden="true" />
                            {overdue ? `Overdue ${formatDate(issue.dueDate)}` : formatDate(issue.dueDate)}
                        </span>
                    )}
                    <IssueLabelChips labels={issue.labels || []} max={3} />
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => onOpenPanel(issue.id)}
                title={jiraLike ? "Open details panel" : "Quick preview"}
                aria-label={`Preview ${issue.key}`}
            >
                <IconEye aria-hidden="true" />
            </Button>
        </li>
    );
}

function RowsSkeleton({ rows = 4 }) {
    return (
        <ul aria-hidden="true">
            {Array.from({ length: rows }, (_, i) => (
                <li key={i} className="flex items-center gap-3 border-t-2 border-border px-4 py-3.5 first:border-t-0">
                    <span className="h-9 w-9 bg-muted" />
                    <div className="flex-1 space-y-2">
                        <div className="dash-skeleton h-3 w-2/3 bg-muted" />
                        <div className="dash-skeleton h-2.5 w-1/3 bg-muted" />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function StageMeter({ issues }) {
    const counts = ALL_STATUSES
        .map((status) => ({ status, count: issues.filter((issue) => issue.status === status).length }))
        .filter((entry) => entry.count > 0);

    return (
        <WidgetShell title="All stages" count={issues.length} tourId="stages">
            {counts.length === 0 ? (
                <EmptyState title="No issues yet" hint="Stage totals appear once issues exist." />
            ) : (
                <div className="p-4">
                    <div className="dash-stagebar flex h-4 gap-[2px]" role="img" aria-label="Issues by status">
                        {counts.map((entry) => (
                            <span
                                key={entry.status}
                                title={`${STATUS_LABELS[entry.status]}: ${entry.count}`}
                                style={{ flexGrow: entry.count, background: STATUS_COLORS[entry.status] }}
                            />
                        ))}
                    </div>
                    <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                        {counts.map((entry) => (
                            <li key={entry.status} className={cn("flex min-w-0 items-center gap-2", `st-${entry.status}`)}>
                                <StatusGlyph status={entry.status} size={14} />
                                <span className="truncate text-sm text-muted-foreground">{STATUS_LABELS[entry.status]}</span>
                                <span className="px-num ml-auto text-sm">{entry.count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </WidgetShell>
    );
}

function ProjectList({ projects, onPreview }) {
    if (projects.length === 0) {
        return <EmptyState icon={IconFolder} title="No owned projects" hint="Projects you create show up here." />;
    }

    return (
        <ul>
            {projects.map((project) => (
                <li key={project.id} className="flex items-center gap-3 border-t-2 border-border px-4 py-3 first:border-t-0">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                            <Link
                                to={`/projects/${project.id}`}
                                title="Open full page"
                                className="truncate font-pixel text-base font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {project.name}
                            </Link>
                            <span className="px-num shrink-0 text-xs text-muted-foreground">
                                {project.doneIssues}/{project.totalIssues}
                            </span>
                        </div>
                        <PxMeter value={project.progress} className="mt-2" label={`${project.name} progress`} />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground"
                        onClick={() => onPreview(project.id)}
                        title="Quick preview"
                        aria-label={`Preview ${project.name}`}
                    >
                        <IconEye aria-hidden="true" />
                    </Button>
                </li>
            ))}
        </ul>
    );
}

function ChartHeaderControls({ projects, projectFilter, onProjectChange, variant, variantOptions, onVariantChange }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select value={variant} onValueChange={onVariantChange}>
                <SelectTrigger className="hud h-9 w-[92px] text-[0.6875rem]" aria-label="Chart type">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {variantOptions.map((opt) => (
                        <SelectItem key={opt} value={opt} className="hud text-[0.6875rem]">{opt}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={onProjectChange}>
                <SelectTrigger className="hud h-9 w-[140px] text-[0.6875rem]" aria-label="Project">
                    <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all" className="hud text-[0.6875rem]">All Projects</SelectItem>
                    {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)} className="hud text-[0.6875rem]">{project.shortName}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// Charts hold data people read: no draw-in animation, square bars on the tile grid.
function DistributionChart({ data, variant, config }) {
    return (
        <ChartContainer config={config} className="h-64 w-full aspect-auto">
            {variant === "pie" ? (
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="label" innerRadius={52} outerRadius={86} paddingAngle={2} isAnimationActive={false} stroke="var(--color-card)" strokeWidth={2}>
                        {data.map((entry) => <Cell key={entry.key} fill={entry.fill} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
            ) : (
                <BarChart data={data} margin={{ left: 0, right: 12 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={HUD_TICK} />
                    <YAxis tickLine={false} axisLine={false} width={30} allowDecimals={false} tick={HUD_TICK} />
                    <Bar dataKey="value" radius={0} isAnimationActive={false}>
                        {data.map((entry) => <Cell key={entry.key} fill={entry.fill} />)}
                    </Bar>
                    <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
            )}
        </ChartContainer>
    );
}

function scopeIssues(issues, projectFilter) {
    return projectFilter === "all"
        ? issues
        : issues.filter((issue) => String(issue.projectId) === String(projectFilter));
}

function IssueStatusChartWidget({ issues, projects, projectFilter, onProjectChange, variant, onVariantChange }) {
    const scopedIssues = scopeIssues(issues, projectFilter);
    const config = Object.fromEntries(ALL_STATUSES.map((status) => [status, { label: STATUS_LABELS[status], color: STATUS_COLORS[status] }]));
    const data = ALL_STATUSES.map((status) => ({
        key: status,
        label: STATUS_LABELS[status],
        value: scopedIssues.filter((issue) => issue.status === status).length,
        fill: STATUS_COLORS[status],
    })).filter((item) => item.value > 0);

    return (
        <WidgetShell
            title="Issue status"
            count={scopedIssues.length}
            action={<ChartHeaderControls projects={projects} projectFilter={projectFilter} onProjectChange={onProjectChange} variant={variant} variantOptions={["pie", "bar"]} onVariantChange={onVariantChange} />}
        >
            <div className="p-4">
                {data.length === 0 ? <EmptyState title="No issue data" /> : <DistributionChart data={data} variant={variant} config={config} />}
            </div>
        </WidgetShell>
    );
}

function IssuePriorityChartWidget({ issues, projects, projectFilter, onProjectChange, variant, onVariantChange }) {
    const scopedIssues = scopeIssues(issues, projectFilter);
    const priorities = Object.keys(PRIORITY_COLORS);
    const config = Object.fromEntries(priorities.map((priority) => [priority, { label: PRIORITY_LABELS[priority], color: PRIORITY_COLORS[priority] }]));
    const data = priorities.map((priority) => ({
        key: priority,
        label: PRIORITY_LABELS[priority],
        value: scopedIssues.filter((issue) => issue.priority === priority).length,
        fill: PRIORITY_COLORS[priority],
    })).filter((item) => item.value > 0);

    return (
        <WidgetShell
            title="Issue priority"
            count={scopedIssues.length}
            action={<ChartHeaderControls projects={projects} projectFilter={projectFilter} onProjectChange={onProjectChange} variant={variant} variantOptions={["bar", "pie"]} onVariantChange={onVariantChange} />}
        >
            <div className="p-4">
                {data.length === 0 ? <EmptyState title="No priority data" /> : <DistributionChart data={data} variant={variant} config={config} />}
            </div>
        </WidgetShell>
    );
}

function IssueTrendChartWidget({ issues, projects, projectFilter, onProjectChange, variant, onVariantChange }) {
    const scopedIssues = scopeIssues(issues, projectFilter);
    const bucket = new Map();
    const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" });
    for (const issue of scopedIssues) {
        if (!issue.createdAt) continue;
        const date = new Date(issue.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const current = bucket.get(key) || { label: monthLabel.format(date), created: 0, done: 0 };
        current.created += 1;
        if (issue.status === "DONE") current.done += 1;
        bucket.set(key, current);
    }

    const data = Array.from(bucket.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([, value]) => value);

    const chartConfig = {
        created: { label: "Created", color: "var(--st-progress)" },
        done: { label: "Done", color: "var(--st-done)" },
    };

    return (
        <WidgetShell
            title="Issue trend"
            action={<ChartHeaderControls projects={projects} projectFilter={projectFilter} onProjectChange={onProjectChange} variant={variant} variantOptions={["line", "bar"]} onVariantChange={onVariantChange} />}
        >
            <div className="p-4">
                {data.length === 0 ? (
                    <EmptyState title="Not enough history yet" />
                ) : (
                    <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
                        {variant === "line" ? (
                            <LineChart data={data} margin={{ left: 0, right: 12 }}>
                                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={HUD_TICK} />
                                <YAxis tickLine={false} axisLine={false} width={30} allowDecimals={false} tick={HUD_TICK} />
                                <Line type="stepAfter" dataKey="created" stroke="var(--color-created)" strokeWidth={3} dot={false} isAnimationActive={false} />
                                <Line type="stepAfter" dataKey="done" stroke="var(--color-done)" strokeWidth={3} dot={false} isAnimationActive={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </LineChart>
                        ) : (
                            <BarChart data={data} margin={{ left: 0, right: 12 }}>
                                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={HUD_TICK} />
                                <YAxis tickLine={false} axisLine={false} width={30} allowDecimals={false} tick={HUD_TICK} />
                                <Bar dataKey="created" radius={0} fill="var(--color-created)" isAnimationActive={false} />
                                <Bar dataKey="done" radius={0} fill="var(--color-done)" isAnimationActive={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </BarChart>
                        )}
                    </ChartContainer>
                )}
            </div>
        </WidgetShell>
    );
}

function ProjectProgressChartWidget({ projects }) {
    const chartConfig = {
        progress: { label: "Progress %", color: "var(--st-done)" },
        issues: { label: "Issues", color: "var(--st-new)" },
    };

    const data = projects.slice(0, 8).map((project) => ({
        name: project.name,
        progress: project.progress,
        issues: project.totalIssues,
    }));

    return (
        <WidgetShell title="Project progress" count={data.length}>
            <div className="p-4">
                {data.length === 0 ? (
                    <EmptyState icon={IconFolder} title="No project data" />
                ) : (
                    <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
                        <BarChart data={data} margin={{ left: 0, right: 12 }}>
                            <CartesianGrid vertical={false} stroke="var(--color-border)" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={HUD_TICK} />
                            <YAxis tickLine={false} axisLine={false} width={30} tick={HUD_TICK} />
                            <Bar dataKey="progress" radius={0} fill="var(--color-progress)" isAnimationActive={false} />
                            <Bar dataKey="issues" radius={0} fill="var(--color-issues)" isAnimationActive={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                        </BarChart>
                    </ChartContainer>
                )}
            </div>
        </WidgetShell>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const { isMobile } = useResponsiveNavigation();
    const { projects, fetchProjects, loading: projectsLoading } = useProjectStore();
    const { issues, fetchIssues, loading: issuesLoading } = useIssueStore();
    const { fetchUsers } = useUserStore();
    const getUserIdFromToken = useAuthStore((state) => state.getUserIdFromToken);
    const authUser = useAuthStore((state) => state.user);

    const flipStateRef = useRef(null);
    const seenStatusRef = useRef(null);
    const tourStartedRef = useRef(false);

    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [createIssueOpen, setCreateIssueOpen] = useState(false);

    const [desktopMode, setDesktopMode] = useState("default");
    const [customWidgets, setCustomWidgets] = useState(DEFAULT_CUSTOM_WIDGETS);
    const [chartPrefs, setChartPrefs] = useState(DEFAULT_CHART_PREFS);
    const [widgetLayout, setWidgetLayout] = useState(DEFAULT_WIDGET_LAYOUT);
    const [storageHydrated, setStorageHydrated] = useState(false);
    const [flashIds, setFlashIds] = useState([]);
    const [tourSteps, setTourSteps] = useState(null);

    const currentUserId = getUserIdFromToken();
    const modeStorageKey = getUserScopedStorageKey(DASHBOARD_MODE_KEY, currentUserId);
    const widgetsStorageKey = getUserScopedStorageKey(DASHBOARD_WIDGETS_KEY, currentUserId);
    const chartPrefsStorageKey = getUserScopedStorageKey(DASHBOARD_CHART_PREFS_KEY, currentUserId);
    const layoutPrefsStorageKey = getUserScopedStorageKey(DASHBOARD_LAYOUT_KEY, currentUserId);

    useEffect(() => {
        fetchProjects();
        fetchIssues();
        fetchUsers();
    }, []);

    useEffect(() => {
        setStorageHydrated(false);
        const anonymousModeKey = getUserScopedStorageKey(DASHBOARD_MODE_KEY, "anonymous");
        const anonymousWidgetsKey = getUserScopedStorageKey(DASHBOARD_WIDGETS_KEY, "anonymous");
        const anonymousChartPrefsKey = getUserScopedStorageKey(DASHBOARD_CHART_PREFS_KEY, "anonymous");
        const anonymousLayoutPrefsKey = getUserScopedStorageKey(DASHBOARD_LAYOUT_KEY, "anonymous");
        const pickExistingKey = (preferred, fallback) => (
            localStorage.getItem(preferred) != null ? preferred : fallback
        );

        const savedMode = localStorage.getItem(modeStorageKey) ?? localStorage.getItem(anonymousModeKey);
        const savedWidgets = safeReadJson(pickExistingKey(widgetsStorageKey, anonymousWidgetsKey), DEFAULT_CUSTOM_WIDGETS);
        const savedChartPrefs = safeReadJson(pickExistingKey(chartPrefsStorageKey, anonymousChartPrefsKey), DEFAULT_CHART_PREFS);
        const savedLayoutPrefs = safeReadJson(pickExistingKey(layoutPrefsStorageKey, anonymousLayoutPrefsKey), DEFAULT_WIDGET_LAYOUT);

        setDesktopMode(savedMode === "default" || savedMode === "custom" || savedMode === "jira" ? savedMode : "default");
        setCustomWidgets(Array.isArray(savedWidgets) && savedWidgets.length > 0 ? savedWidgets : DEFAULT_CUSTOM_WIDGETS);
        setChartPrefs({ ...DEFAULT_CHART_PREFS, ...(savedChartPrefs || {}) });
        setWidgetLayout({ ...DEFAULT_WIDGET_LAYOUT, ...(savedLayoutPrefs || {}) });
        setStorageHydrated(true);
    }, [modeStorageKey, widgetsStorageKey, chartPrefsStorageKey, layoutPrefsStorageKey]);

    useEffect(() => {
        if (!storageHydrated) return;
        localStorage.setItem(modeStorageKey, desktopMode);
        localStorage.setItem(widgetsStorageKey, JSON.stringify(customWidgets));
        localStorage.setItem(chartPrefsStorageKey, JSON.stringify(chartPrefs));
        localStorage.setItem(layoutPrefsStorageKey, JSON.stringify(widgetLayout));
    }, [
        storageHydrated,
        modeStorageKey,
        widgetsStorageKey,
        chartPrefsStorageKey,
        layoutPrefsStorageKey,
        desktopMode,
        customWidgets,
        chartPrefs,
        widgetLayout,
    ]);

    const loading = projectsLoading || issuesLoading;
    const activeMode = isMobile ? "default" : desktopMode;
    const jiraLikeMode = activeMode === "jira";

    const hasData = projects.length > 0 || issues.length > 0;

    const openTour = () => {
        tourStartedRef.current = true;
        setTourSteps(tourStepsForScreen({ demo: isDemoSession() }));
    };

    const closeTour = () => {
        setTourSteps(null);
        markTourSeen(currentUserId);
    };

    // First visit on the demo account: offer the walkthrough once real data is on screen
    useEffect(() => {
        if (tourStartedRef.current || loading || !hasData || !isDemoSession() || hasSeenTour(currentUserId)) return;
        tourStartedRef.current = true;
        const timer = window.setTimeout(() => setTourSteps(tourStepsForScreen({ demo: true })), 700);
        return () => window.clearTimeout(timer);
    }, [loading, hasData, currentUserId]);

    // An issue whose status changed since the last data load flashes its sprite color once
    useEffect(() => {
        const next = new Map(issues.map((issue) => [issue.id, issue.status]));
        const previous = seenStatusRef.current;
        seenStatusRef.current = next;
        if (!previous) return;
        const changed = issues.filter((issue) => previous.has(issue.id) && previous.get(issue.id) !== issue.status).map((issue) => issue.id);
        if (changed.length === 0) return;
        setFlashIds(changed);
        const timer = window.setTimeout(() => setFlashIds([]), 600);
        return () => window.clearTimeout(timer);
    }, [issues]);

    // Widget reorder / toggle: FLIP the moved widgets (and configurator rows) to their new slots in whole-pixel steps
    const runWithFlip = (update) => {
        if (!prefersReducedMotion()) {
            flipStateRef.current = Flip.getState("[data-dash-flip]");
        }
        update();
    };

    useLayoutEffect(() => {
        const state = flipStateRef.current;
        if (!state) return;
        flipStateRef.current = null;
        Flip.from(state, {
            targets: "[data-dash-flip]",
            duration: 0.24,
            ease: "steps(6)",
            simple: true,
        });
    }, [customWidgets]);

    const projectsWithStats = useMemo(() => projects.map((project) => {
        const scopedIssues = issues.filter((issue) => issue.projectId === project.id);
        const done = scopedIssues.filter((issue) => issue.status === "DONE").length;
        // Same grouping as the board's Basic mode
        const active = scopedIssues.filter((issue) => ["IN_PROGRESS", "WAITING_FOR_TEAM", "CODE_REVIEW"].includes(issue.status)).length;
        const todo = scopedIssues.filter((issue) => ["NEW", "TRIAGE", "TODO"].includes(issue.status)).length;
        const progress = scopedIssues.length > 0 ? Math.round((done / scopedIssues.length) * 100) : 0;
        return {
            id: project.id,
            ownerId: project.ownerId,
            shortName: project.shortName,
            name: project.shortName,
            description: project.description || "No description",
            totalIssues: scopedIssues.length,
            doneIssues: done,
            inProgressIssues: active,
            todoIssues: todo,
            progress,
            createdAt: project.createdAt,
        };
    }), [projects, issues]);

    const yourProjects = useMemo(
        () => projectsWithStats
            .filter((project) => String(project.ownerId) === String(currentUserId))
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5),
        [projectsWithStats, currentUserId]
    );

    const yourOpenIssues = useMemo(
        () => issues
            .filter((issue) => String(issue.assigneeId) === String(currentUserId) && issue.status !== "DONE" && issue.status !== "CANCELED")
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
        [issues, currentUserId]
    );
    const yourIssues = yourOpenIssues.slice(0, 6);

    const recentProjects = useMemo(
        () => [...projectsWithStats]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 6),
        [projectsWithStats]
    );

    const issuesByProject = useMemo(() => {
        const map = new Map();
        for (const issue of issues) {
            const arr = map.get(issue.projectId) || [];
            arr.push(issue);
            map.set(issue.projectId, arr);
        }
        return map;
    }, [issues]);

    const doneIssues = issues.filter((issue) => issue.status === "DONE").length;
    const completionRate = issues.length > 0 ? Math.round((doneIssues / issues.length) * 100) : 0;

    const today = startOfToday();
    const overdueCount = yourOpenIssues.filter((issue) => issue.dueDate && new Date(issue.dueDate).getTime() < today).length;
    const dueSoonCount = yourOpenIssues.filter((issue) => {
        if (!issue.dueDate) return false;
        const due = new Date(issue.dueDate).getTime();
        return due >= today && due < today + 7 * DAY_MS;
    }).length;
    const inReviewCount = yourOpenIssues.filter((issue) => issue.status === "CODE_REVIEW").length;
    const waitingCount = yourOpenIssues.filter((issue) => issue.status === "WAITING_FOR_TEAM").length;

    const now = new Date();
    const firstName = authUser?.firstName;
    const summaryParts = [
        yourOpenIssues.length === 0
            ? "Nothing open is assigned to you"
            : `${yourOpenIssues.length} open ${yourOpenIssues.length === 1 ? "issue" : "issues"} assigned to you`,
    ];
    if (dueSoonCount > 0) summaryParts.push(`${dueSoonCount} due in the next 7 days`);
    if (overdueCount > 0) summaryParts.push(`${overdueCount} overdue`);

    const customWidgetsOrdered = customWidgets.filter((id) => CUSTOM_WIDGET_OPTIONS.some((item) => item.id === id));
    const configuratorRows = [
        ...customWidgetsOrdered.map((id) => CUSTOM_WIDGET_OPTIONS.find((item) => item.id === id)),
        ...CUSTOM_WIDGET_OPTIONS.filter((item) => !customWidgetsOrdered.includes(item.id)),
    ];

    const toggleCustomWidget = (widgetId) => runWithFlip(() => {
        setCustomWidgets((prev) => {
            if (prev.includes(widgetId)) {
                return prev.length === 1 ? prev : prev.filter((item) => item !== widgetId);
            }
            return [...prev, widgetId];
        });
    });

    const moveCustomWidget = (widgetId, direction) => runWithFlip(() => {
        setCustomWidgets((prev) => {
            const index = prev.indexOf(widgetId);
            if (index < 0) return prev;
            const target = direction === "up" ? index - 1 : index + 1;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            const [item] = next.splice(index, 1);
            next.splice(target, 0, item);
            return next;
        });
    });

    const updateChartPref = (key, value) => setChartPrefs((prev) => ({ ...prev, [key]: value }));
    const updateWidgetLayout = (widgetId, span) => setWidgetLayout((prev) => ({ ...prev, [widgetId]: span }));
    const getWidgetSpanClass = (widgetId) => ((widgetLayout[widgetId] || DEFAULT_WIDGET_LAYOUT[widgetId]) === "half"
        ? "md:col-span-1 xl:col-span-6"
        : "md:col-span-2 xl:col-span-12");

    const renderYourIssuesWidget = () => (
        <WidgetShell title="Your Issues" count={yourOpenIssues.length} tourId="your-issues" action={<HeaderLink to="/issues">All issues</HeaderLink>}>
            {loading && yourIssues.length === 0 ? (
                <RowsSkeleton />
            ) : yourIssues.length === 0 ? (
                <EmptyState title="Queue clear" hint="Issues assigned to you will land here." />
            ) : (
                <ul>
                    {yourIssues.map((issue) => (
                        <IssueRow key={issue.id} issue={issue} jiraLike={jiraLikeMode} onOpenPanel={setSelectedIssueId} flash={flashIds.includes(issue.id)} />
                    ))}
                </ul>
            )}
        </WidgetShell>
    );

    const renderRecentProjectsWidget = () => (
        <WidgetShell title="Recent projects" count={recentProjects.length} plain tourId="recent-projects" action={<HeaderLink to="/projects">All projects</HeaderLink>}>
            {loading && recentProjects.length === 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((i) => <div key={i} className="dash-skeleton h-72 border-2 border-border bg-muted" />)}
                </div>
            ) : recentProjects.length === 0 ? (
                <div className="border-2 border-dashed border-border">
                    <EmptyState icon={IconFolder} title="No projects yet" hint="Create a project to start filing issues." />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {recentProjects.map((project) => (
                        <ProjectFlipCard
                            key={project.id}
                            project={project}
                            issues={issuesByProject.get(project.id) || []}
                            onPreview={setSelectedProjectId}
                            onIssuePreview={setSelectedIssueId}
                        />
                    ))}
                </div>
            )}
        </WidgetShell>
    );

    const renderYourProjectsWidget = () => (
        <WidgetShell title="Your Projects" count={yourProjects.length} tourId="your-projects">
            {loading && yourProjects.length === 0 ? <RowsSkeleton rows={3} /> : <ProjectList projects={yourProjects} onPreview={setSelectedProjectId} />}
        </WidgetShell>
    );

    const chartProps = (variantKey) => ({
        issues,
        projects,
        projectFilter: chartPrefs.projectId,
        onProjectChange: (value) => updateChartPref("projectId", value),
        variant: chartPrefs[variantKey],
        onVariantChange: (value) => updateChartPref(variantKey, value),
    });

    const renderCustomWidget = (widgetId) => {
        switch (widgetId) {
            case "your-issues":
                return renderYourIssuesWidget();
            case "recent-projects":
                return renderRecentProjectsWidget();
            case "your-projects":
                return renderYourProjectsWidget();
            case "issue-status-chart":
                return <IssueStatusChartWidget {...chartProps("issueStatusVariant")} />;
            case "issue-priority-chart":
                return <IssuePriorityChartWidget {...chartProps("issuePriorityVariant")} />;
            case "issue-trend-chart":
                return <IssueTrendChartWidget {...chartProps("issueTrendVariant")} />;
            case "project-progress-chart":
                return <ProjectProgressChartWidget projects={recentProjects} />;
            default:
                return null;
        }
    };

    return (
        <AppLayout>
            <div className="dash mx-auto w-full max-w-[1400px]">
                <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="px-display text-2xl leading-none md:text-3xl">
                            {greetingFor(now)}{firstName ? `, ${firstName}` : ""}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">{summaryParts.join(" · ")}.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {!isMobile && <ModeSwitch value={desktopMode} onChange={setDesktopMode} />}
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={openTour} title="Walk through the interface">
                            <IconHelp aria-hidden="true" />
                            Guide
                        </Button>
                        {!isMobile && desktopMode === "custom" && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5">
                                        <IconCog aria-hidden="true" />
                                        Widgets
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-[400px] max-w-[calc(100vw-2rem)] border-2 p-2">
                                    <p className="hud px-2 pb-2 pt-1 text-[0.625rem] text-muted-foreground">Shown widgets, top to bottom</p>
                                    <ul className="space-y-1">
                                        {configuratorRows.map((widget) => {
                                            const index = customWidgetsOrdered.indexOf(widget.id);
                                            const enabled = index !== -1;
                                            const width = widgetLayout[widget.id] || DEFAULT_WIDGET_LAYOUT[widget.id] || "full";
                                            return (
                                                <li
                                                    key={widget.id}
                                                    data-flip-id={`cfg-${widget.id}`}
                                                    data-dash-flip
                                                    className={cn("flex items-center gap-2 border-2 px-2 py-1.5 text-sm", enabled ? "border-border bg-muted" : "border-transparent text-muted-foreground")}
                                                >
                                                    <Checkbox
                                                        checked={enabled}
                                                        onCheckedChange={() => toggleCustomWidget(widget.id)}
                                                        aria-label={`Show ${widget.label}`}
                                                    />
                                                    <span className="min-w-0 flex-1 truncate">{widget.label}</span>
                                                    {enabled && (
                                                        <div className="flex border-2 border-border bg-card" role="group" aria-label={`${widget.label} width`}>
                                                            {["half", "full"].map((span) => (
                                                                <button
                                                                    key={span}
                                                                    type="button"
                                                                    aria-pressed={width === span}
                                                                    onClick={() => updateWidgetLayout(widget.id, span)}
                                                                    className={cn(
                                                                        "hud px-1.5 py-0.5 text-[0.625rem]",
                                                                        width === span ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                                                    )}
                                                                >
                                                                    {span}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => moveCustomWidget(widget.id, "up")}
                                                        disabled={!enabled || index <= 0}
                                                        aria-label={`Move ${widget.label} up`}
                                                    >
                                                        <IconArrowUp aria-hidden="true" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => moveCustomWidget(widget.id, "down")}
                                                        disabled={!enabled || index >= customWidgetsOrdered.length - 1}
                                                        aria-label={`Move ${widget.label} down`}
                                                    >
                                                        <IconArrowDown aria-hidden="true" />
                                                    </Button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </PopoverContent>
                            </Popover>
                        )}
                        <div className="relative">
                            <AddButton label="Project" variant="outline" onClick={() => setCreateProjectOpen(true)} />
                            <span className="sr-only">+P</span>
                        </div>
                        <div className="relative" data-tour="new-issue">
                            <AddButton label="Issue" onClick={() => setCreateIssueOpen(true)} />
                            <span className="sr-only">+I</span>
                        </div>
                    </div>
                </header>

                <HudBar
                    items={[
                        { label: "Player", value: firstName || authUser?.email?.split("@")[0] || "P1", text: true, wide: true },
                        { label: "Open", value: pad2(yourOpenIssues.length) },
                        { label: "Due 7d", value: pad2(dueSoonCount), tone: dueSoonCount > 0 ? "text-[var(--px-cyan)]" : undefined },
                        { label: "Overdue", value: pad2(overdueCount), tone: overdueCount > 0 ? "text-[var(--px-red)]" : undefined },
                        { label: "Wait", value: pad2(waitingCount), tone: waitingCount > 0 ? "text-[var(--st-waiting)]" : undefined },
                        { label: "Review", value: pad2(inReviewCount), tone: inReviewCount > 0 ? "text-[var(--st-review)]" : undefined },
                        { label: "Done", value: pad2(doneIssues), tone: "text-[var(--px-gold)]" },
                        { label: "Clear", value: `${completionRate}%`, meter: completionRate, grow: true },
                    ]}
                />

                {/* Keyed by mode so a layout switch steps in instead of snapping */}
                <div key={activeMode} className="dash-swap">
                    {activeMode === "custom" ? (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-12">
                            {customWidgetsOrdered.map((widgetId) => (
                                <div key={widgetId} data-flip-id={`w-${widgetId}`} data-dash-flip className={cn("min-w-0", getWidgetSpanClass(widgetId))}>
                                    {renderCustomWidget(widgetId)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-10 xl:grid-cols-12 xl:items-start">
                            <div className="min-w-0 xl:col-span-8">{renderYourIssuesWidget()}</div>
                            <aside className="flex min-w-0 flex-col gap-10 xl:col-span-4">
                                <StageMeter issues={issues} />
                                {renderYourProjectsWidget()}
                            </aside>
                            <div className="min-w-0 xl:col-span-12">{renderRecentProjectsWidget()}</div>
                        </div>
                    )}
                </div>
            </div>

            <ProductTour steps={tourSteps || []} open={Boolean(tourSteps?.length)} onClose={closeTour} />

            <ProjectDetailsModal
                open={!!selectedProjectId}
                onOpenChange={() => setSelectedProjectId(null)}
                projectId={selectedProjectId}
            />
            <IssueDetailsModal
                open={!!selectedIssueId}
                onOpenChange={() => setSelectedIssueId(null)}
                issueId={selectedIssueId}
                onIssueDeleted={() => {
                    setSelectedIssueId(null);
                    fetchIssues();
                }}
                contentClassName={jiraLikeMode
                    ? "!left-auto !top-0 !right-0 !translate-x-0 !translate-y-0 !h-dvh !w-[min(100vw,1100px)] !max-w-[min(100vw,1100px)] border-l-2 border-border !duration-200 data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right"
                    : ""}
            />
            <CreateProjectModal open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
            <CreateIssueModal open={createIssueOpen} onOpenChange={setCreateIssueOpen} />
        </AppLayout>
    );
}
