import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Separator } from "@/components/ui/Separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { useIssueStore } from "@/store/issueStore";
import { useProjectStore } from "@/store/projectStore";
import { useUserStore } from "@/store/userStore";
import { useTeamStore } from "@/store/teamStore";
import { useAuthStore } from "@/store/authStore";
import { useMasterdataStore } from "@/store/masterdataStore";
import { IssueDetailsModal } from "@/components/modals/IssueDetailsModal";
import { CreateIssueModal } from "@/components/modals/CreateIssueModal";
import { AddButton } from "@/components/ui/AddButton";
import { IssueLabelChips } from "@/components/ui/IssueLabelChips";
import { useResponsiveNavigation } from "@/hooks/useResponsiveNavigation";
import {
    Plus, Search, X, ListTodo, Eye, ChevronDown,
    SlidersHorizontal, ArrowUpDown, RotateCcw, Check,
    Calendar, User,
} from "lucide-react";
import { toast } from "sonner";
import {
    STATUS_LABELS, PRIORITY_LABELS, ALL_STATUSES, ALL_PRIORITIES,
    getStatusBadgeClass, getPriorityBadgeVariant,
} from "@/utils/issueConstants";
import {
    LABEL_TYPE,
    getLabelName,
    getLabelOptionValue,
    getLabelTokens,
    issueHasLabel,
    normalizeLabelToken,
} from "@/utils/labelUtils";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SORT_OPTIONS = [
    { value: "createdAt__desc", label: "Newest first" },
    { value: "createdAt__asc",  label: "Oldest first" },
    { value: "updatedAt__desc", label: "Recently updated" },
    { value: "updatedAt__asc",  label: "Least recently updated" },
];

// ─── Issue row (Board / Dashboard card style) ─────────────────────────────────
function IssueRow({ issue, isMobile, onPreview, getUserName }) {
    const date = formatDate(issue.dueDate);
    const name = getUserName(issue.assigneeId);

    return (
        <div className="group flex items-start gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-border/80 hover:shadow-sm transition-all duration-150">
            <div className="flex-1 min-w-0">
                {/* Key + title */}
                <div className="flex items-center gap-2 mb-1.5 min-w-0">
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 font-medium">
                        {issue.key}
                    </span>
                    {isMobile ? (
                        <span
                            className="text-sm font-semibold text-foreground cursor-pointer hover:underline line-clamp-1 flex-1 min-w-0"
                            onClick={() => onPreview(issue.id)}
                        >
                            {issue.title}
                        </span>
                    ) : (
                        <Link
                            to={`/issues/${issue.id}`}
                            title="Open full page"
                            className="text-sm font-semibold text-foreground hover:underline line-clamp-1 flex-1 min-w-0"
                        >
                            {issue.title}
                        </Link>
                    )}
                </div>
                {/* Meta row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className={cn("text-xs", getStatusBadgeClass(issue.status))}>
                        {STATUS_LABELS[issue.status] || issue.status}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(issue.priority)} className="text-xs">
                        {PRIORITY_LABELS[issue.priority] || issue.priority}
                    </Badge>
                    {date && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {date}
                        </span>
                    )}
                    {name && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" />
                            {name}
                        </span>
                    )}
                </div>
                <IssueLabelChips labels={issue.labels || []} max={4} className="mt-2" />
            </div>
            <button
                title="Quick preview"
                onClick={() => onPreview(issue.id)}
                className="shrink-0 text-muted-foreground hover:text-primary transition-opacity opacity-0 group-hover:opacity-100 mt-0.5"
            >
                <Eye className="h-4 w-4" />
            </button>
        </div>
    );
}

// ─── Pill multi-select ────────────────────────────────────────────────────────
function PillMultiSelect({ label, options, selected, onToggle }) {
    const hasSelected = selected.length > 0;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={hasSelected ? "default" : "outline"}
                    size="sm"
                    className="h-9 gap-1.5 text-sm font-medium shrink-0"
                >
                    {label}
                    {hasSelected && (
                        <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-foreground text-primary text-[10px] font-bold px-1">
                            {selected.length}
                        </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-0.5">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => onToggle(opt.value)}
                            className={cn(
                                "w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left transition-colors",
                                selected.includes(opt.value)
                                    ? "bg-accent font-medium text-foreground"
                                    : "hover:bg-accent text-foreground"
                            )}
                        >
                            <span className={cn(
                                "flex-shrink-0 h-3.5 w-3.5 rounded-sm border flex items-center justify-center transition-colors",
                                selected.includes(opt.value)
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground/60 dark:border-muted-foreground/40"
                            )}>
                                {selected.includes(opt.value) && (
                                    <Check className="h-2.5 w-2.5 text-primary-foreground stroke-[3]" />
                                )}
                            </span>
                            {opt.label}
                        </button>
                    ))}
                </div>
                {hasSelected && (
                    <>
                        <Separator className="my-2" />
                        <button
                            onClick={() => options.forEach(opt => selected.includes(opt.value) && onToggle(opt.value))}
                            className="w-full text-xs text-center text-muted-foreground hover:text-foreground py-1 transition-colors"
                        >
                            Clear selection
                        </button>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}

// ─── Filter panel (shared desktop + mobile sheet) ────────────────────────────
function FilterPanel({ state, handlers, projects, teams, users, labels = [] }) {
    const {
        statusFilter, priorityFilter, projectFilter, teamFilter,
        assigneeFilter, labelFilter, sortValue, dateFrom, dateTo, hasActiveFilters,
    } = state;
    const {
        toggleStatus, togglePriority, setProjectFilter, setTeamFilter,
        setAssigneeFilter, toggleLabel, setSortValue, setDateFrom, setDateTo, clearFilters,
    } = handlers;

    const statusOptions   = ALL_STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }));
    const priorityOptions = ALL_PRIORITIES.map(p => ({ value: p, label: PRIORITY_LABELS[p] }));
    const labelOptions    = labels.map(label => ({ value: getLabelOptionValue(label), label: getLabelName(label) }));

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filter panel</p>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Clear all filters
                    </Button>
                )}
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Status</p>
                <div className="flex flex-wrap gap-1.5">
                    {statusOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => toggleStatus(opt.value)}
                            className={cn(
                                "text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
                                statusFilter.includes(opt.value)
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-primary/50 hover:bg-accent"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Priority</p>
                <div className="flex flex-wrap gap-1.5">
                    {priorityOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => togglePriority(opt.value)}
                            className={cn(
                                "text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
                                priorityFilter.includes(opt.value)
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-primary/50 hover:bg-accent"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {labelOptions.length > 0 && (
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Labels</p>
                    <div className="flex flex-wrap gap-1.5">
                        {labelOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => toggleLabel(opt.value)}
                                className={cn(
                                    "text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
                                    labelFilter.includes(opt.value)
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border hover:border-primary/50 hover:bg-accent"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Separator />

            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Project</p>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Projects" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.shortName}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Team</p>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Teams" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {teams.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Assignee</p>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="All Assignees" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        {users.map(u => (
                            <SelectItem key={u.id} value={String(u.id)}>
                                {`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Created Date Range</p>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label className="text-xs text-muted-foreground">From</Label>
                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 mt-1 [color-scheme:light] dark:[color-scheme:dark]" />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">To</Label>
                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 mt-1 [color-scheme:light] dark:[color-scheme:dark]" />
                    </div>
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Sort By</p>
                <Select value={sortValue} onValueChange={setSortValue}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// ─── Filter persistence ───────────────────────────────────────────────────────
const FILTER_KEY_PREFIX = "issues_filters";
const getFilterStorageKey = (userId) => `${FILTER_KEY_PREFIX}:${userId || "anonymous"}`;

function loadSavedFilters(userId) {
    try {
        return JSON.parse(localStorage.getItem(getFilterStorageKey(userId)) || "{}");
    } catch {
        return {};
    }
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Issues() {
    const { isMobile } = useResponsiveNavigation();
    const { issues, fetchIssues, loading } = useIssueStore();
    const { projects, fetchProjects }      = useProjectStore();
    const { users, fetchUsers }            = useUserStore();
    const { teams, fetchTeams }            = useTeamStore();
    const { fetchByType }                  = useMasterdataStore();
    const authUser = useAuthStore((state) => state.user);
    const getUserIdFromToken = useAuthStore((state) => state.getUserIdFromToken);
    const [searchParams] = useSearchParams();

    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [availableLabels, setAvailableLabels] = useState([]);

    const currentUserId = authUser?.id || getUserIdFromToken();
    const filterStorageKey = getFilterStorageKey(currentUserId);
    const saved = loadSavedFilters(currentUserId);

    const [searchTerm,     setSearchTerm]     = useState(saved.searchTerm     ?? "");
    const [statusFilter,   setStatusFilter]   = useState(saved.statusFilter   ?? []);
    const [priorityFilter, setPriorityFilter] = useState(saved.priorityFilter ?? []);
    const [projectFilter,  setProjectFilter]  = useState(saved.projectFilter  ?? "all");
    const [teamFilter,     setTeamFilter]     = useState(saved.teamFilter     ?? "all");
    const [assigneeFilter, setAssigneeFilter] = useState(saved.assigneeFilter ?? "all");
    const [labelFilter,    setLabelFilter]    = useState(saved.labelFilter    ?? []);
    const [sortValue,      setSortValue]      = useState(saved.sortValue      ?? "createdAt__desc");
    const [dateFrom,       setDateFrom]       = useState(saved.dateFrom       ?? "");
    const [dateTo,         setDateTo]         = useState(saved.dateTo         ?? "");

    const headerRef = useRef(null);
    const listRef   = useRef(null);

    useEffect(() => {
        fetchIssues();
        fetchProjects();
        fetchUsers();
        fetchTeams();
        fetchByType(LABEL_TYPE).then(setAvailableLabels);
    }, []);

    // Persist filters for the current user across reloads
    useEffect(() => {
        localStorage.setItem(filterStorageKey, JSON.stringify({
            searchTerm, statusFilter, priorityFilter, projectFilter,
            teamFilter, assigneeFilter, labelFilter, sortValue, dateFrom, dateTo,
        }));
    }, [filterStorageKey, searchTerm, statusFilter, priorityFilter, projectFilter, teamFilter, assigneeFilter, labelFilter, sortValue, dateFrom, dateTo]);

    // Rehydrate when user identity changes (e.g. after token refresh/login)
    useEffect(() => {
        const stored = loadSavedFilters(currentUserId);
        setSearchTerm(stored.searchTerm ?? "");
        setStatusFilter(stored.statusFilter ?? []);
        setPriorityFilter(stored.priorityFilter ?? []);
        setProjectFilter(stored.projectFilter ?? "all");
        setTeamFilter(stored.teamFilter ?? "all");
        setAssigneeFilter(stored.assigneeFilter ?? "all");
        setLabelFilter(stored.labelFilter ?? []);
        setSortValue(stored.sortValue ?? "createdAt__desc");
        setDateFrom(stored.dateFrom ?? "");
        setDateTo(stored.dateTo ?? "");
    }, [currentUserId]);

    // Apply URL params on mount (dashboard "view all" links)
    useEffect(() => {
        const assignee  = searchParams.get("assignee");
        const status    = searchParams.get("status");
        const priority  = searchParams.get("priority");
        const project   = searchParams.get("project");
        const team      = searchParams.get("team");
        const label     = searchParams.get("label");
        const sort      = searchParams.get("sort");

        if (assignee) setAssigneeFilter(assignee);
        if (status)   setStatusFilter(status.split(",").filter(Boolean));
        if (priority) setPriorityFilter(priority.split(",").filter(Boolean));
        if (project)  setProjectFilter(project);
        if (team)     setTeamFilter(team);
        if (label)    setLabelFilter(label.split(",").filter(Boolean));
        if (sort && SORT_OPTIONS.find(o => o.value === sort)) setSortValue(sort);
    }, []);

    // Header slide-in on mount
    useEffect(() => {
        const ctx = gsap.context(() => {
            if (headerRef.current) {
                gsap.fromTo(headerRef.current,
                    { y: -28, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "y,transform" }
                );
            }
        });
        return () => ctx.revert();
    }, []);

    // Rows stagger after data loads
    useEffect(() => {
        if (!loading && listRef.current) {
            const rows = listRef.current.querySelectorAll(".issue-row");
            if (rows.length > 0) {
                gsap.fromTo(rows,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: "power2.out", clearProps: "transform,opacity" }
                );
            }
        }
    }, [loading]);

    const getUserName = useCallback((userId) => {
        if (!userId) return null;
        const found = users.find(u => String(u.id) === String(userId));
        if (found) return `${found.firstName || ""} ${found.lastName || ""}`.trim() || null;
        return null;
    }, [users]);

    const toggleStatus   = (s) => setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    const togglePriority = (p) => setPriorityFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    const toggleLabel    = (label) => setLabelFilter(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]);

    const getLabelForFilter = (value) => {
        const normalized = normalizeLabelToken(value);
        return availableLabels.find(label =>
            getLabelOptionValue(label) === String(value) ||
            getLabelTokens(label).includes(normalized)
        );
    };

    const clearFilters = () => {
        setSearchTerm(""); setStatusFilter([]); setPriorityFilter([]);
        setProjectFilter("all"); setTeamFilter("all"); setAssigneeFilter("all");
        setLabelFilter([]);
        setSortValue("createdAt__desc"); setDateFrom(""); setDateTo("");
        localStorage.removeItem(filterStorageKey);
        toast.success("Filters cleared");
    };

    const activeFilterCount = [
        searchTerm !== "",
        statusFilter.length > 0,
        priorityFilter.length > 0,
        projectFilter !== "all",
        teamFilter !== "all",
        assigneeFilter !== "all",
        labelFilter.length > 0,
        dateFrom !== "",
        dateTo !== "",
        sortValue !== "createdAt__desc",
    ].filter(Boolean).length;

    const hasActiveFilters = activeFilterCount > 0;
    const [sortField, sortDir] = sortValue.split("__");

    const filteredIssues = issues
        .filter(issue => {
            const matchesSearch =
                (issue.title?.toLowerCase()       || "").includes(searchTerm.toLowerCase()) ||
                (issue.key?.toLowerCase()          || "").includes(searchTerm.toLowerCase()) ||
                (issue.description?.toLowerCase()  || "").includes(searchTerm.toLowerCase());
            const matchesStatus   = statusFilter.length === 0 || statusFilter.includes(issue.status);
            const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(issue.priority);
            const matchesProject  = projectFilter === "all" || String(issue.projectId) === projectFilter;
            const matchesTeam     = teamFilter === "all" || String(issue.team?.id) === teamFilter;
            const matchesAssignee = assigneeFilter === "all" || String(issue.assigneeId) === assigneeFilter;
            const matchesLabel    = labelFilter.length === 0 || labelFilter.some(value => issueHasLabel(issue, getLabelForFilter(value) || value));
            const issueDate       = issue.createdAt ? new Date(issue.createdAt) : null;
            const matchesDateFrom = !dateFrom || !issueDate || issueDate >= new Date(dateFrom);
            const matchesDateTo   = !dateTo   || !issueDate || issueDate <= new Date(dateTo + "T23:59:59");
            return matchesSearch && matchesStatus && matchesPriority &&
                matchesProject && matchesTeam && matchesAssignee &&
                matchesLabel && matchesDateFrom && matchesDateTo;
        })
        .sort((a, b) => {
            const dir  = sortDir === "desc" ? -1 : 1;
            const valA = new Date(a[sortField] || 0);
            const valB = new Date(b[sortField] || 0);
            return (valA - valB) * dir;
        });

    const filterPanelState    = { statusFilter, priorityFilter, projectFilter, teamFilter, assigneeFilter, labelFilter, sortValue, dateFrom, dateTo, hasActiveFilters };
    const filterPanelHandlers = { toggleStatus, togglePriority, setProjectFilter, setTeamFilter, setAssigneeFilter, toggleLabel, setSortValue, setDateFrom, setDateTo, clearFilters };

    // Stats
    const openIssues   = issues.filter(i => i.status !== "DONE" && i.status !== "CANCELED").length;
    const activeIssues = issues.filter(i => i.status === "IN_PROGRESS").length;
    const doneIssues   = issues.filter(i => i.status === "DONE").length;

    const statItems = [
        { label: "Total",  value: issues.length,            color: "text-violet-600 dark:text-violet-400",   tooltip: "All issues available in the current workspace." },
        { label: "Open",   value: openIssues,               color: "text-blue-600 dark:text-blue-400",       tooltip: "Issues that are not done or canceled." },
        { label: "Active", value: activeIssues,             color: "text-orange-600 dark:text-orange-400",   tooltip: "Issues currently in progress." },
        { label: "Done",   value: doneIssues,               color: "text-emerald-600 dark:text-emerald-400", tooltip: "Issues completed successfully." },
        ...(hasActiveFilters ? [{ label: "Shown", value: filteredIssues.length, color: "text-muted-foreground", tooltip: "Number of issues visible after applying filters." }] : []),
    ];

    const activeFilterBadges = [
        ...(searchTerm ? [{
            key: "search-term",
            text: `Search: ${searchTerm}`,
            onRemove: () => setSearchTerm(""),
        }] : []),
        ...statusFilter.map(s => ({ key: `status-${s}`, text: `Status: ${STATUS_LABELS[s]}`, onRemove: () => toggleStatus(s) })),
        ...priorityFilter.map(p => ({ key: `priority-${p}`, text: `Priority: ${PRIORITY_LABELS[p]}`, onRemove: () => togglePriority(p) })),
        ...(assigneeFilter !== "all" ? [{
            key: `assignee-${assigneeFilter}`,
            text: `Assignee: ${getUserName(assigneeFilter) || `User #${assigneeFilter}`}`,
            onRemove: () => setAssigneeFilter("all"),
        }] : []),
        ...(projectFilter !== "all" ? [{
            key: `project-${projectFilter}`,
            text: `Project: ${projects.find(p => String(p.id) === projectFilter)?.shortName || projectFilter}`,
            onRemove: () => setProjectFilter("all"),
        }] : []),
        ...(teamFilter !== "all" ? [{
            key: `team-${teamFilter}`,
            text: `Team: ${teams.find(t => String(t.id) === teamFilter)?.name || teamFilter}`,
            onRemove: () => setTeamFilter("all"),
        }] : []),
        ...labelFilter.map(value => {
            const label = getLabelForFilter(value);
            return {
                key: `label-${value}`,
                text: `Label: ${label ? getLabelName(label) : value}`,
                onRemove: () => toggleLabel(value),
            };
        }),
        ...((dateFrom || dateTo) ? [{
            key: "date-range",
            text: `Date: ${dateFrom && dateTo ? `${dateFrom} – ${dateTo}` : dateFrom || dateTo}`,
            onRemove: () => { setDateFrom(""); setDateTo(""); },
        }] : []),
        ...(sortValue !== "createdAt__desc" ? [{
            key: "sort-value",
            text: `Sort: ${SORT_OPTIONS.find(opt => opt.value === sortValue)?.label || sortValue}`,
            onRemove: () => setSortValue("createdAt__desc"),
        }] : []),
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AppLayout>
            {/* ── Full-bleed Stats Bar ── */}
            <div ref={headerRef} className="-mx-4 -mt-4 mb-6 border-b border-border bg-card md:-mx-8 md:-mt-8">
                <div className="flex items-center gap-2 px-4 md:px-6 py-4">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3 md:flex-nowrap md:justify-start md:gap-6">
                        {statItems.map((s, i) => (
                            <div
                                key={s.label}
                                className="flex items-center gap-2 md:gap-5 shrink-0 cursor-help"
                                title={s.tooltip}
                                aria-label={`${s.label}: ${s.tooltip}`}
                            >
                                {i > 0 && <div className="hidden md:block w-px h-6 bg-border shrink-0" />}
                                <div>
                                    <p className={cn("text-[10px] uppercase tracking-wider font-medium", s.color)}>
                                        {s.label}
                                    </p>
                                    <p className="text-xl font-bold leading-none mt-0.5 tabular-nums">{s.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop create button */}
                    <div className="hidden md:flex shrink-0 ml-4">
                        <AddButton label="New Issue" onClick={() => setCreateModalOpen(true)} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* ── Search + mobile controls ── */}
                <div className="flex min-w-0 gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, key, or description…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        {searchTerm && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setSearchTerm("")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Mobile: filters sheet button */}
                    {isMobile && (
                        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="relative shrink-0 px-3">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold leading-none">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
                                <SheetHeader className="mb-5">
                                    <SheetTitle className="flex items-center gap-2">
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Filters &amp; Sorting
                                        {activeFilterCount > 0 && (
                                            <Badge variant="secondary" className="text-xs">{activeFilterCount} active</Badge>
                                        )}
                                    </SheetTitle>
                                </SheetHeader>
                                <FilterPanel
                                    state={filterPanelState}
                                    handlers={filterPanelHandlers}
                                    projects={projects}
                                    teams={teams}
                                    users={users}
                                    labels={availableLabels}
                                />
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* Mobile create button */}
                    <Button size="sm" onClick={() => setCreateModalOpen(true)} className="md:hidden shrink-0 px-3">
                        <Plus className="h-4 w-4" />
                    </Button>

                    {/* Clear filters */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearFilters}
                            title="Reset all filters"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* ── Desktop filter bar ── */}
                {!isMobile && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <PillMultiSelect
                            label="Status"
                            options={ALL_STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                            selected={statusFilter}
                            onToggle={toggleStatus}
                        />
                        <PillMultiSelect
                            label="Priority"
                            options={ALL_PRIORITIES.map(p => ({ value: p, label: PRIORITY_LABELS[p] }))}
                            selected={priorityFilter}
                            onToggle={togglePriority}
                        />
                        {availableLabels.length > 0 && (
                            <PillMultiSelect
                                label="Labels"
                                options={availableLabels.map(label => ({
                                    value: getLabelOptionValue(label),
                                    label: getLabelName(label),
                                }))}
                                selected={labelFilter}
                                onToggle={toggleLabel}
                            />
                        )}

                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                            <SelectTrigger className={cn("h-9 text-sm w-auto min-w-[110px]", projectFilter !== "all" && "border-primary")}>
                                <SelectValue placeholder="Project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.shortName}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={teamFilter} onValueChange={setTeamFilter}>
                            <SelectTrigger className={cn("h-9 text-sm w-auto min-w-[100px]", teamFilter !== "all" && "border-primary")}>
                                <SelectValue placeholder="Team" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Teams</SelectItem>
                                {teams.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className={cn("h-9 text-sm w-auto min-w-[110px]", assigneeFilter !== "all" && "border-primary")}>
                                <SelectValue placeholder="Assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Assignees</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date range popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={dateFrom || dateTo ? "default" : "outline"}
                                    size="sm"
                                    className="h-9 gap-1.5 text-sm shrink-0"
                                >
                                    Date Range
                                    {(dateFrom || dateTo) && (
                                        <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-foreground text-primary text-[10px] font-bold px-1">
                                            {[dateFrom, dateTo].filter(Boolean).length}
                                        </span>
                                    )}
                                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-3" align="start">
                                <p className="text-xs font-semibold text-muted-foreground mb-3">CREATED DATE RANGE</p>
                                <div className="space-y-2">
                                    <div>
                                        <Label className="text-xs">From</Label>
                                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 mt-1 [color-scheme:light] dark:[color-scheme:dark]" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">To</Label>
                                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 mt-1 [color-scheme:light] dark:[color-scheme:dark]" />
                                    </div>
                                    {(dateFrom || dateTo) && (
                                        <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                                            Clear dates
                                        </Button>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Select value={sortValue} onValueChange={setSortValue}>
                            <SelectTrigger className="h-9 w-auto text-sm gap-1.5">
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* ── Active filter pills ── */}
                {hasActiveFilters && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                        <div className="flex flex-wrap gap-2">
                            {activeFilterBadges.map((filter) => (
                                <Badge
                                    key={filter.key}
                                    variant="outline"
                                    className="h-7 gap-1 rounded-full border-primary/30 bg-background/85 px-2 text-xs text-primary"
                                >
                                    <span>{filter.text}</span>
                                    <button
                                        onClick={filter.onRemove}
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10 hover:text-destructive"
                                        aria-label={`Remove ${filter.text}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Issue list ── */}
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[68px] rounded-xl bg-muted/40 animate-pulse" />
                        ))}
                    </div>
                ) : filteredIssues.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-14 text-center space-y-3">
                        <ListTodo className="mx-auto h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-foreground">
                            {hasActiveFilters ? "No issues match your filters" : "No issues found"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {hasActiveFilters ? "Try adjusting your search criteria" : "Create your first issue to get started"}
                        </p>
                        {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div ref={listRef} className="space-y-2">
                        {filteredIssues.map(issue => (
                            <div key={issue.id} className="issue-row">
                                <IssueRow
                                    issue={issue}
                                    isMobile={isMobile}
                                    onPreview={setSelectedIssueId}
                                    getUserName={getUserName}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <IssueDetailsModal
                open={!!selectedIssueId}
                onOpenChange={() => setSelectedIssueId(null)}
                issueId={selectedIssueId}
                onIssueDeleted={() => { setSelectedIssueId(null); fetchIssues(); }}
                onIssueUpdated={() => fetchIssues()}
            />
            <CreateIssueModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onIssueCreated={() => fetchIssues()}
            />
        </AppLayout>
    );
}
