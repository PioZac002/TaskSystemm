import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { IssueLabelChips } from "@/components/ui/IssueLabelChips";
import { Button } from "@/components/ui/Button";
import {
    Plus, Eye, ArrowLeft, ChevronRight, Inbox,
    Circle, Clock, CheckCircle, AlertCircle, Timer,
    GitPullRequest, XCircle, ListTodo,
} from "lucide-react";
import { useIssueStore } from "@/store/issueStore";
import { useProjectStore } from "@/store/projectStore";
import { useUserStore } from "@/store/userStore";
import { CreateIssueModal } from "@/components/modals/CreateIssueModal";
import { IssueDetailsModal } from "@/components/modals/IssueDetailsModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { ALL_STATUSES, PRIORITY_LABELS, STATUS_LABELS, getPriorityBadgeVariant } from "@/utils/issueConstants";
import { AddButton } from "@/components/ui/AddButton";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";
import { shouldAnimateEntrance } from "@/lib/motion";

// ─── Basic mode: 3 grouped columns ────────────────────────────────────────────
const BASIC_COLUMNS = [
    {
        id: "basic_todo",
        targetStatus: "NEW",
        statuses: ["NEW", "TRIAGE", "TODO"],
        title: "To Do",
        groupHint: "New · Triage · To Do",
        Icon: ListTodo,
        dot: "bg-slate-400",
        iconBg: "bg-slate-400",
        accentColor: "#94a3b8",
        text: "text-slate-600 dark:text-slate-400",
        ring: "ring-slate-400/30",
    },
    {
        id: "basic_inprogress",
        targetStatus: "IN_PROGRESS",
        statuses: ["IN_PROGRESS", "WAITING_FOR_TEAM", "CODE_REVIEW"],
        title: "In Progress",
        groupHint: "In Progress · Waiting · Review",
        Icon: Clock,
        dot: "bg-blue-500",
        iconBg: "bg-blue-500",
        accentColor: "#3b82f6",
        text: "text-blue-600 dark:text-blue-400",
        ring: "ring-blue-500/30",
    },
    {
        id: "basic_done",
        targetStatus: "DONE",
        statuses: ["DONE", "CANCELED"],
        title: "Done",
        groupHint: "Done · Canceled",
        Icon: CheckCircle,
        dot: "bg-emerald-500",
        iconBg: "bg-emerald-500",
        accentColor: "#10b981",
        text: "text-emerald-600 dark:text-emerald-400",
        ring: "ring-emerald-500/30",
    },
];

// ─── Detailed mode: 8 individual status columns ────────────────────────────────
const DETAILED_COLUMNS = [
    {
        id: "NEW", targetStatus: "NEW", statuses: ["NEW"],
        title: "New", groupHint: null, Icon: Circle,
        dot: "bg-gray-400", iconBg: "bg-gray-500", accentColor: "#9ca3af",
        text: "text-gray-600 dark:text-gray-400", ring: "ring-gray-400/30",
    },
    {
        id: "TRIAGE", targetStatus: "TRIAGE", statuses: ["TRIAGE"],
        title: "Triage", groupHint: null, Icon: AlertCircle,
        dot: "bg-yellow-500", iconBg: "bg-yellow-500", accentColor: "#eab308",
        text: "text-yellow-600 dark:text-yellow-400", ring: "ring-yellow-500/30",
    },
    {
        id: "TODO", targetStatus: "TODO", statuses: ["TODO"],
        title: "To Do", groupHint: null, Icon: ListTodo,
        dot: "bg-slate-400", iconBg: "bg-slate-400", accentColor: "#94a3b8",
        text: "text-slate-600 dark:text-slate-400", ring: "ring-slate-400/30",
    },
    {
        id: "IN_PROGRESS", targetStatus: "IN_PROGRESS", statuses: ["IN_PROGRESS"],
        title: "In Progress", groupHint: null, Icon: Clock,
        dot: "bg-blue-500", iconBg: "bg-blue-500", accentColor: "#3b82f6",
        text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30",
    },
    {
        id: "WAITING_FOR_TEAM", targetStatus: "WAITING_FOR_TEAM", statuses: ["WAITING_FOR_TEAM"],
        title: "Waiting", groupHint: null, Icon: Timer,
        dot: "bg-orange-500", iconBg: "bg-orange-500", accentColor: "#f97316",
        text: "text-orange-600 dark:text-orange-400", ring: "ring-orange-500/30",
    },
    {
        id: "CODE_REVIEW", targetStatus: "CODE_REVIEW", statuses: ["CODE_REVIEW"],
        title: "Review", groupHint: null, Icon: GitPullRequest,
        dot: "bg-purple-500", iconBg: "bg-purple-500", accentColor: "#a855f7",
        text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30",
    },
    {
        id: "DONE", targetStatus: "DONE", statuses: ["DONE"],
        title: "Done", groupHint: null, Icon: CheckCircle,
        dot: "bg-emerald-500", iconBg: "bg-emerald-500", accentColor: "#10b981",
        text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/30",
    },
    {
        id: "CANCELED", targetStatus: "CANCELED", statuses: ["CANCELED"],
        title: "Canceled", groupHint: null, Icon: XCircle,
        dot: "bg-red-400", iconBg: "bg-red-400", accentColor: "#f87171",
        text: "text-red-500 dark:text-red-400", ring: "ring-red-400/30",
    },
];

// ─── Mobile column list item (Teams-style, mobile only) ───────────────────────
function ColumnListItem({ col, count, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "board-col-item w-full text-left rounded-xl px-3 py-3 flex items-center gap-3 transition-all duration-200 group",
                isActive ? cn("shadow-sm ring-1", col.ring) : "hover:bg-muted/60"
            )}
            style={isActive ? { backgroundColor: col.accentColor + "18" } : {}}
        >
            <span className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125",
                col.dot
            )} />
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold truncate", isActive && col.text)}>
                    {col.title}
                </p>
                {col.groupHint && (
                    <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{col.groupHint}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                    {count} issue{count !== 1 ? "s" : ""}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-xs tabular-nums">{count}</Badge>
                <ChevronRight className={cn(
                    "h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200",
                    isActive && "translate-x-0.5 text-muted-foreground"
                )} />
            </div>
        </button>
    );
}

// ─── Priority order for sorting ───────────────────────────────────────────────
const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

// ─── Main component ────────────────────────────────────────────────────────────
export default function Board() {
    const { issues, fetchIssues } = useIssueStore();
    const { projects, fetchProjects } = useProjectStore();
    const { users, fetchUsers } = useUserStore();

    const [selectedProjectId,  setSelectedProjectId]  = useState("all");
    const [selectedAssigneeId, setSelectedAssigneeId] = useState("all");
    const [boardMode, setBoardMode]                   = useState("basic"); // "basic" | "detailed"
    const [createModalOpen, setCreateModalOpen]     = useState(false);
    const [selectedIssueId, setSelectedIssueId]     = useState(null);
    const [activeColumnId, setActiveColumnId]       = useState(BASIC_COLUMNS[0].id);
    const [mobileView, setMobileView]               = useState("list"); // "list" | "detail"

    // ── Animation refs ────────────────────────────────────────────────────────
    // Note: only opacity animations on DnD containers to avoid transform
    // conflicts that cause drag-position bugs in @hello-pangea/dnd
    const statsBarRef    = useRef(null);
    const kanbanRef      = useRef(null);
    const mobileColRef   = useRef(null);
    const mobilePanelRef = useRef(null);
    const cardsAnimated  = useRef(false);

    // ── Derived data ─────────────────────────────────────────────────────────
    const activeColumns  = boardMode === "basic" ? BASIC_COLUMNS : DETAILED_COLUMNS;
    const filteredIssues = issues
        .filter(i => selectedProjectId  === "all" || i.projectId === Number(selectedProjectId))
        .filter(i => selectedAssigneeId === "all" || String(i.assigneeId) === selectedAssigneeId);
    const activeColumn            = activeColumns.find(c => c.id === activeColumnId) ?? activeColumns[0];
    const activeColumnIssues      = filteredIssues.filter(i => activeColumn.statuses.includes(i.status));
    const sortedActiveColIssues   = [...activeColumnIssues].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4));
    const totalIssues        = filteredIssues.length;

    // ── Data fetching ─────────────────────────────────────────────────────────
    useEffect(() => {
        fetchIssues();
        fetchProjects();
        fetchUsers();
    }, []);

    // ── Page-mount animation ──────────────────────────────────────────────────
    // IMPORTANT: kanbanRef uses opacity only (no x/y transform) to prevent
    // @hello-pangea/dnd position calculation bugs caused by lingering transforms
    useEffect(() => {
        if (!shouldAnimateEntrance()) return undefined;
        const ctx = gsap.context(() => {
            if (statsBarRef.current) {
                gsap.fromTo(statsBarRef.current,
                    { y: -32, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "y,transform" }
                );
            }
            if (kanbanRef.current) {
                gsap.fromTo(kanbanRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.45, ease: "power2.out", delay: 0.2, clearProps: "opacity" }
                );
            }
        });
        return () => ctx.revert();
    }, []);

    // ── Stagger desktop cards on first load ───────────────────────────────────
    useEffect(() => {
        if (!kanbanRef.current || issues.length === 0 || cardsAnimated.current) return;
        cardsAnimated.current = true;
        if (!shouldAnimateEntrance()) return;
        const cards = kanbanRef.current.querySelectorAll(".board-card");
        gsap.fromTo(cards,
            { y: 14, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.25, stagger: 0.03, ease: "power2.out", clearProps: "transform,opacity" }
        );
    }, [issues.length]);

    // ── Stagger mobile cards when active column changes ───────────────────────
    useEffect(() => {
        if (!mobileColRef.current || !shouldAnimateEntrance()) return;
        const cards = mobileColRef.current.querySelectorAll(".board-card");
        if (!cards.length) return;
        gsap.fromTo(cards,
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.28, stagger: 0.06, ease: "power2.out", delay: 0.1, clearProps: "transform,opacity" }
        );
    }, [activeColumnId]);

    // ── Mobile panel slide ────────────────────────────────────────────────────
    useEffect(() => {
        if (!mobilePanelRef.current || !shouldAnimateEntrance()) return;
        gsap.fromTo(mobilePanelRef.current,
            { x: mobileView === "detail" ? 40 : -40, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.35, ease: "power3.out", clearProps: "x,transform" }
        );
    }, [mobileView]);

    // ── Board mode switch ─────────────────────────────────────────────────────
    const handleModeChange = (newMode) => {
        if (newMode === boardMode) return;
        setBoardMode(newMode);
        const newCols = newMode === "basic" ? BASIC_COLUMNS : DETAILED_COLUMNS;
        setActiveColumnId(newCols[0].id);
        setMobileView("list");
        cardsAnimated.current = false;
    };

    // ── Moving an issue ───────────────────────────────────────────────────────
    // Shared by desktop drag-and-drop and the mobile status picker, since dragging
    // a card across columns is not a gesture a phone can offer.
    const moveIssue = async (issue, newStatus) => {
        if (!issue || issue.status === newStatus) return;
        try {
            await apiClient.put("/api/v1/issue/update", {
                IssueId:     issue.id,
                Title:       issue.title || null,
                Description: issue.description?.trim() || null,
                Status:      newStatus,
                Priority:    issue.priority || null,
                TeamId:      issue.team?.id || null,
                ProjectId:   issue.projectId || null,
                DueDate:     issue.dueDate ? issue.dueDate.slice(0, 10) : null,
                AssigneeId:  issue.assigneeId || null,
            });
            toast.success(`${issue.key} moved to ${STATUS_LABELS[newStatus] || newStatus}`);
            cardsAnimated.current = false;
            fetchIssues();
        } catch (error) {
            toast.error("Failed to update status");
            console.error(error);
        }
    };

    // ── Drag-and-drop ─────────────────────────────────────────────────────────
    const handleDragEnd = (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || destination.droppableId === source.droppableId) return;

        const destCol = activeColumns.find(c => c.id === destination.droppableId);
        const issue   = issues.find(i => i.id === Number(draggableId));
        if (!destCol || !issue) return;

        moveIssue(issue, destCol.targetStatus);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AppLayout>
            <div className="app-bleed flex min-w-0 flex-col overflow-hidden">

                {/* ── Stats Bar — no scrolling, all controls on one line ── */}
                <div
                    ref={statsBarRef}
                    className="shrink-0 flex min-w-0 items-center gap-3 px-4 md:px-6 py-3 border-b border-border bg-card"
                >
                    {/* Total */}
                    <div className="shrink-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Issues</p>
                        <p className="text-2xl font-bold leading-none mt-0.5">{totalIssues}</p>
                    </div>

                    <div className="w-px h-8 bg-border shrink-0" />

                    {/* Board mode toggle */}
                    <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5 shrink-0">
                        <button
                            onClick={() => handleModeChange("basic")}
                            className={cn(
                                "px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                                boardMode === "basic"
                                    ? "bg-card shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Basic
                        </button>
                        <button
                            onClick={() => handleModeChange("detailed")}
                            className={cn(
                                "px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                                boardMode === "detailed"
                                    ? "bg-card shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Detailed
                        </button>
                    </div>

                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        {/* Project + Assignee filters — desktop only */}
                        <div className="hidden md:flex items-center gap-2">
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger className="w-[150px] h-9 bg-background border-border text-sm">
                                    <SelectValue placeholder="All Projects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Projects</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.shortName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                                <SelectTrigger className={cn("w-[150px] h-9 bg-background border-border text-sm", selectedAssigneeId !== "all" && "border-primary")}>
                                    <SelectValue placeholder="All Members" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Members</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="hidden sm:block">
                            <AddButton label="New Issue" onClick={() => setCreateModalOpen(true)} />
                        </div>
                        <Button onClick={() => setCreateModalOpen(true)} size="sm" className="sm:hidden gap-2">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* ── Main area ── */}
                <div className="flex min-w-0 flex-1 overflow-hidden">

                    {/* ── Mobile only: column navigator (hidden on md+) ── */}
                    <div
                        className={cn(
                            "flex flex-col border-r border-border bg-muted/20 overflow-hidden shrink-0 w-full md:hidden",
                            mobileView === "detail" ? "hidden" : "flex"
                        )}
                    >
                        {/* Mobile project + assignee filter */}
                        <div className="shrink-0 px-3 py-3 border-b border-border space-y-2">
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger className="w-full h-9 bg-background border-border text-sm">
                                    <SelectValue placeholder="All Projects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Projects</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.shortName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                                <SelectTrigger className={cn("w-full h-9 bg-background border-border text-sm", selectedAssigneeId !== "all" && "border-primary")}>
                                    <SelectValue placeholder="All Members" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Members</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Column list */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                            {activeColumns.map((col) => {
                                const count = filteredIssues.filter(i => col.statuses.includes(i.status)).length;
                                return (
                                    <ColumnListItem
                                        key={col.id}
                                        col={col}
                                        count={count}
                                        isActive={col.id === activeColumnId}
                                        onClick={() => {
                                            setActiveColumnId(col.id);
                                            setMobileView("detail");
                                        }}
                                    />
                                );
                            })}
                        </div>

                        <div className="shrink-0 px-4 py-3 border-t border-border">
                            <p className="text-xs text-muted-foreground/60 text-center">
                                {totalIssues} issue{totalIssues !== 1 ? "s" : ""} total
                            </p>
                        </div>
                    </div>

                    {/* ── Right: desktop kanban + mobile column detail ── */}
                    <div
                        className={cn(
                            "flex-1 flex flex-col overflow-hidden",
                            mobileView === "list" ? "hidden md:flex" : "flex"
                        )}
                    >
                        {/* ── Desktop: DnD Kanban ── */}
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <div
                                ref={kanbanRef}
                                className={cn("flex-1 overflow-y-hidden hidden md:flex divide-x divide-border overflow-x-hidden", boardMode === "detailed" && "board-detailed-kanban")}
                            >
                                {activeColumns.map((col) => {
                                    const colIssues = filteredIssues
                                        .filter(i => col.statuses.includes(i.status))
                                        .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4));
                                    return (
                                        <div
                                            key={col.id}
                                            className="board-column flex flex-col overflow-hidden bg-background flex-1 min-w-0"
                                        >
                                            {/* Column header — color accent via top border */}
                                            <div
                                                className="shrink-0 px-4 py-3 border-b border-border bg-card flex items-center gap-2.5 border-t-2"
                                                style={{ borderTopColor: col.accentColor }}
                                            >
                                                <span className={cn("h-2 w-2 rounded-full shrink-0", col.dot)} />
                                                <div className="flex-1 min-w-0">
                                                    <h2 className={cn("font-semibold text-sm leading-none", col.text)}>{col.title}</h2>
                                                    {col.groupHint && boardMode === "basic" && (
                                                        <p className="text-[10px] text-muted-foreground/50 mt-0.5 hidden xl:block truncate">
                                                            {col.groupHint}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant="secondary" className="text-xs tabular-nums shrink-0">{colIssues.length}</Badge>
                                            </div>

                                            {/* Droppable */}
                                            <Droppable droppableId={col.id}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={cn(
                                                            "flex-1 overflow-y-auto p-3 space-y-2 transition-colors duration-200",
                                                            snapshot.isDraggingOver && "bg-primary/5"
                                                        )}
                                                    >
                                                        {colIssues.map((issue, index) => (
                                                            <Draggable key={issue.id} draggableId={String(issue.id)} index={index}>
                                                                {(provided, snapshot) => {
                                                                    if (boardMode === "detailed") {
                                                                        return (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                className={cn("board-flip-outer", snapshot.isDragging && "opacity-90")}
                                                                            >
                                                                                <div className="board-flip-inner">
                                                                                    <div className="board-flip-front">
                                                                                        <p className="font-mono text-[9px] text-muted-foreground">{issue.key}</p>
                                                                                        <p className="text-[11px] font-semibold text-foreground truncate">
                                                                                            {issue.title.length > 18 ? issue.title.slice(0, 18) + '…' : issue.title}
                                                                                        </p>
                                                                                        <Badge variant={getPriorityBadgeVariant(issue.priority)} className="text-[9px] self-start mt-auto">
                                                                                            {PRIORITY_LABELS[issue.priority] || issue.priority}
                                                                                        </Badge>
                                                                                        <IssueLabelChips labels={issue.labels || []} max={1} badgeClassName="text-[9px] px-1.5 py-0" />
                                                                                    </div>
                                                                                    <div className="board-flip-back">
                                                                                        <span className="font-mono text-[9px] text-white/50">{issue.key}</span>
                                                                                        <p className="text-xs font-semibold text-white text-center leading-tight px-1">
                                                                                            {issue.title}
                                                                                        </p>
                                                                                        <button
                                                                                            onClick={(e) => { e.stopPropagation(); setSelectedIssueId(issue.id); }}
                                                                                            className="mt-1 text-white/70 hover:text-white text-[10px] flex items-center gap-1 transition-colors"
                                                                                        >
                                                                                            <Eye className="h-3 w-3" /> View
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            className={cn(
                                                                                "board-card group flex flex-col gap-2 p-3 rounded-xl bg-card border border-border",
                                                                                "hover:border-border/80 hover:shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing",
                                                                                snapshot.isDragging && "shadow-xl opacity-90 border-primary/30 rotate-1"
                                                                            )}
                                                                        >
                                                                            <div className="flex items-start gap-2">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="font-mono text-[10px] text-muted-foreground mb-0.5">{issue.key}</p>
                                                                                    <Link
                                                                                        to={`/issues/${issue.id}`}
                                                                                        className="text-sm font-semibold hover:underline text-foreground block line-clamp-2"
                                                                                    >
                                                                                        {issue.title}
                                                                                    </Link>
                                                                                </div>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setSelectedIssueId(issue.id); }}
                                                                                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary mt-0.5"
                                                                                    title="Quick preview"
                                                                                >
                                                                                    <Eye className="h-3.5 w-3.5" />
                                                                                </button>
                                                                            </div>
                                                                            <Badge
                                                                                variant={getPriorityBadgeVariant(issue.priority)}
                                                                                className="text-xs self-start"
                                                                            >
                                                                                {PRIORITY_LABELS[issue.priority] || issue.priority}
                                                                            </Badge>
                                                                            <IssueLabelChips labels={issue.labels || []} max={2} />
                                                                        </div>
                                                                    );
                                                                }}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                        {colIssues.length === 0 && !snapshot.isDraggingOver && (
                                                            <div className="py-10 text-center">
                                                                <Inbox className="h-7 w-7 mx-auto text-muted-foreground/25 mb-1.5" />
                                                                <p className="text-xs text-muted-foreground/40">Drop here</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    );
                                })}
                            </div>
                        </DragDropContext>

                        {/* ── Mobile: selected column detail (Teams-style) ── */}
                        <div
                            ref={mobileView === "detail" ? mobilePanelRef : null}
                            className="flex flex-col flex-1 overflow-hidden md:hidden"
                        >
                            {/* Header */}
                            <div
                                className="shrink-0 px-4 py-5 border-b border-border bg-card border-t-2"
                                style={{ borderTopColor: activeColumn.accentColor }}
                            >
                                <button
                                    onClick={() => setMobileView("list")}
                                    className="flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" /> All columns
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", activeColumn.iconBg)}>
                                        <activeColumn.Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold">{activeColumn.title}</h1>
                                        {activeColumn.groupHint && boardMode === "basic" && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{activeColumn.groupHint}</p>
                                        )}
                                        <Badge variant="secondary" className="text-xs mt-1">
                                            {activeColumnIssues.length} issue{activeColumnIssues.length !== 1 ? "s" : ""}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Issue list */}
                            <div ref={mobileColRef} className="flex-1 overflow-y-auto">
                                <div className="px-4 py-5 space-y-2">
                                    {activeColumnIssues.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-border py-10 text-center space-y-2">
                                            <Inbox className="h-8 w-8 mx-auto text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No issues in this column</p>
                                        </div>
                                    ) : sortedActiveColIssues.map((issue) => (
                                        <div
                                            key={issue.id}
                                            className="board-card group flex items-start gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-border/80 hover:shadow-sm transition-all duration-150"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-mono text-[10px] text-muted-foreground mb-0.5">{issue.key}</p>
                                                <h3
                                                    className="text-sm font-semibold text-foreground cursor-pointer hover:underline line-clamp-2"
                                                    onClick={() => setSelectedIssueId(issue.id)}
                                                >
                                                    {issue.title}
                                                </h3>
                                                <Badge
                                                    variant={getPriorityBadgeVariant(issue.priority)}
                                                    className="text-xs mt-1.5"
                                                >
                                                    {PRIORITY_LABELS[issue.priority] || issue.priority}
                                                </Badge>
                                                <IssueLabelChips labels={issue.labels || []} max={2} className="mt-1.5" />

                                                {/* Phones cannot drag between columns, so the status is editable here */}
                                                <Select value={issue.status} onValueChange={(status) => moveIssue(issue, status)}>
                                                    <SelectTrigger
                                                        aria-label={`Status of ${issue.key}`}
                                                        className="mt-2.5 h-9 w-full bg-background border-border text-xs"
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ALL_STATUSES.map((status) => (
                                                            <SelectItem key={status} value={status} className="text-sm">
                                                                {STATUS_LABELS[status]}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedIssueId(issue.id)}
                                                className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 mt-0.5"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CreateIssueModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
            <IssueDetailsModal
                open={!!selectedIssueId}
                onOpenChange={() => setSelectedIssueId(null)}
                issueId={selectedIssueId}
                onIssueDeleted={() => {
                    setSelectedIssueId(null);
                    fetchIssues();
                }}
            />
        </AppLayout>
    );
}
