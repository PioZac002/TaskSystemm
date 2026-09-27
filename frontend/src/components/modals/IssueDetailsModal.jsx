import { useEffect, useState } from "react";
import { useResponsiveNavigation } from "@/hooks/useResponsiveNavigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Card, CardContent } from "@/components/ui/Card";
import { CommentSection } from "@/components/comments/CommentSection";
import { ActivityLog } from "@/components/activity/ActivityLog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import apiClient from "@/services/apiClient";
import { useProjectStore } from "@/store/projectStore";
import { toast } from "sonner";
import { Save, X, Calendar, User as UserIcon, Users, Tag, FolderKanban } from "lucide-react";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EditButton } from "@/components/ui/EditButton";
import { LabelsSelect } from "@/components/ui/LabelsSelect";
import { IssueLabelChips } from "@/components/ui/IssueLabelChips";
import { useMasterdataStore } from "@/store/masterdataStore";
import { labelIdsToMasterdataValues } from "@/utils/labelUtils";
import { STATUS_LABELS, PRIORITY_LABELS, ALL_STATUSES, ALL_PRIORITIES, getStatusBadgeClass, getPriorityBadgeVariant } from "@/utils/issueConstants";

export function IssueDetailsModal({ open, onOpenChange, issueId, onIssueDeleted, onIssueUpdated, contentClassName = "", contentPrefix = null }) {
    const { isMobile } = useResponsiveNavigation();
    const [issue, setIssue] = useState(null);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [edit, setEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inlineSaving, setInlineSaving] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        status: "",
        priority: "",
        dueDate: "",
        assigneeId: "",
        teamId: "",
        projectId: "",
        labelIds: [],
    });
    const [availableLabels, setAvailableLabels] = useState([]);

    const { fetchByType } = useMasterdataStore();

    const { projects, fetchProjects } = useProjectStore();

    useEffect(() => {
        if (open && issueId) {
            loadData();
            setEdit(false);
            fetchProjects();
            fetchByType('ISSUE_LABEL').then(setAvailableLabels);
        }
    }, [open, issueId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [issueRes, usersRes, teamsRes] = await Promise.all([
                apiClient.get(`/api/v1/issue/id/${issueId}`),
                apiClient.get("/api/v1/user/all"),
                apiClient.get("/api/v1/team/all"),
            ]);

            const issueData = issueRes.data;
            setIssue(issueData);
            setUsers(usersRes.data);
            setTeams(teamsRes.data);

            const existingLabelIds = (issueData.labels || []).map(l => String(l.id ?? l));
            setForm({
                title: issueData.title || "",
                description: issueData.description || "",
                status: issueData.status || "NEW",
                priority: issueData.priority || "NORMAL",
                dueDate: issueData.dueDate ? issueData.dueDate.slice(0, 10) : "",
                assigneeId: issueData.assigneeId ? String(issueData.assigneeId) : "unassigned",
                teamId: issueData.team?.id ? String(issueData.team.id) : "none",
                projectId: issueData.projectId ? String(issueData.projectId) : "",
                labelIds: existingLabelIds,
            });
        } catch (error) {
            toast.error("Failed to load issue details");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const buildUpdatePayload = (overrides = {}) => ({
        IssueId: Number(issue.id),
        Title: issue.title || null,
        Description: issue.description?.trim() || null,
        Status: issue.status || null,
        Priority: issue.priority || null,
        TeamId: issue.team?.id || null,
        ProjectId: issue.projectId || null,
        DueDate: issue.dueDate ? issue.dueDate.slice(0, 10) : null,
        AssigneeId: issue.assigneeId || null,
        ...overrides,
    });

    const handleInlineStatusChange = async (newStatus) => {
        if (newStatus === issue.status) return;
        setInlineSaving(true);
        try {
            await apiClient.put("/api/v1/issue/update", buildUpdatePayload({ Status: newStatus }));
            setIssue(prev => ({ ...prev, status: newStatus }));
            setForm(prev => ({ ...prev, status: newStatus }));
            toast.success("Status updated");
            if (onIssueUpdated) onIssueUpdated();
        } catch {
            toast.error("Failed to update status");
        } finally {
            setInlineSaving(false);
        }
    };

    const handleInlinePriorityChange = async (newPriority) => {
        if (newPriority === issue.priority) return;
        setInlineSaving(true);
        try {
            await apiClient.put("/api/v1/issue/update", buildUpdatePayload({ Priority: newPriority }));
            setIssue(prev => ({ ...prev, priority: newPriority }));
            setForm(prev => ({ ...prev, priority: newPriority }));
            toast.success("Priority updated");
            if (onIssueUpdated) onIssueUpdated();
        } catch {
            toast.error("Failed to update priority");
        } finally {
            setInlineSaving(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!issue) return;

            setLoading(true);
            const masterDataValues = labelIdsToMasterdataValues(availableLabels, form.labelIds);

            await apiClient.put("/api/v1/issue/update", {
                IssueId: Number(issue.id),
                Title: form.title || null,
                Description: form.description.trim() || null,
                Status: form.status || null,
                Priority: form.priority || null,
                TeamId: form.teamId && form.teamId !== "none" ? Number(form.teamId) : null,
                ProjectId: form.projectId ? Number(form.projectId) : (issue.projectId || null),
                DueDate: form.dueDate || null,
                AssigneeId: form.assigneeId && form.assigneeId !== "unassigned" ? Number(form.assigneeId) : null,
                masterDataValues,
            });

            toast.success("Issue updated successfully!");

            const selectedTeam = form.teamId !== "none"
                ? (teams.find(t => String(t.id) === form.teamId) || issue.team || null)
                : null;

            setIssue(prev => ({
                ...prev,
                title:      form.title,
                description: form.description,
                status:     form.status,
                priority:   form.priority,
                assigneeId: form.assigneeId && form.assigneeId !== "unassigned" ? Number(form.assigneeId) : null,
                projectId:  form.projectId ? Number(form.projectId) : prev.projectId,
                dueDate:    form.dueDate || null,
                team:       selectedTeam,
                labels:     masterDataValues,
                updatedAt:  new Date().toISOString(),
            }));
            setEdit(false);

            if (onIssueUpdated) {
                onIssueUpdated();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.Message || error.message || "Failed to update issue";
            toast.error(errorMessage);
            console.error('Update error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteIssue = async () => {
        if (!window.confirm("Are you sure you want to delete this issue? This action cannot be undone.")) {
            return;
        }

        try {
            await apiClient.delete(`/api/v1/issue/${issue.id}`);
            toast.success("Issue deleted successfully!");
            onOpenChange(false);
            if (onIssueDeleted) {
                onIssueDeleted(issue.id);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.Message || error.message || "Failed to delete issue";
            toast.error(errorMessage);
        }
    };

    if (!issue && !loading) return null;

    const assignedUser = users.find(u => u.id === issue?.assigneeId);
    const currentProject = projects.find(p => p.id === issue?.projectId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-[95vw] w-full md:max-w-[1400px] h-[95vh] overflow-hidden p-0 flex flex-col ${contentClassName}`}>
                {contentPrefix}
                {loading && !issue ? (
                    <div className="py-12 text-center text-muted-foreground">
                        Loading...
                    </div>
                ) : (
                    <>
                        {/* Header - Sticky */}
                        <div className="shrink-0 bg-background border-b px-4 md:px-6 py-3 md:py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                                        <span className="text-xs md:text-sm font-mono text-muted-foreground">
                                            {issue.key}
                                        </span>
                                        <Badge variant="secondary" className={`text-xs ${getStatusBadgeClass(issue.status)}`}>
                                            {STATUS_LABELS[issue.status] || issue.status}
                                        </Badge>
                                    </div>
                                    {edit ? (
                                        <Input
                                            value={form.title}
                                            onChange={(e) => handleChange("title", e.target.value)}
                                            className="text-lg md:text-xl font-semibold h-auto py-1"
                                        />
                                    ) : (
                                        <DialogTitle className="text-lg md:text-2xl font-bold pr-4 md:pr-8" title={issue.title}>
                                            {isMobile
                                                ? (issue.title.length > 30 ? issue.title.slice(0, 30) + '…' : issue.title)
                                                : (issue.title.length > 70 ? issue.title.slice(0, 70) + '…' : issue.title)}
                                        </DialogTitle>
                                    )}
                                </div>
                                <div className="flex gap-1 md:gap-2 shrink-0 mr-8">
                                    {!edit ? (
                                        <>
                                            <EditButton onClick={() => setEdit(true)} disabled={loading} />
                                            <DeleteButton onClick={handleDeleteIssue} disabled={loading} />
                                        </>
                                    ) : (
                                        <>
                                            <Button size="sm" onClick={handleSave} disabled={loading}>
                                                <Save className="h-4 w-4 md:mr-2" />
                                                <span className="hidden md:inline">Save</span>
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setEdit(false)}>
                                                <X className="h-4 w-4 md:mr-2" />
                                                <span className="hidden md:inline">Cancel</span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="md:flex md:min-h-full">
                                {/* Main Content */}
                                <div className="flex-1 px-4 md:px-6 py-4 md:py-6 space-y-6">
                                    {/* Mobile: Details First (Compact Cards) */}
                                    <div className="md:hidden space-y-4">
                                        <Card>
                                            <CardContent className="p-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Status */}
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground mb-2 block">
                                                            Status
                                                        </Label>
                                                        {edit ? (
                                                            <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                                                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {ALL_STATUSES.map(s => (
                                                                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Select value={issue.status} onValueChange={handleInlineStatusChange} disabled={inlineSaving}>
                                                                <SelectTrigger className="h-9">
                                                                    <span className="text-xs">{STATUS_LABELS[issue.status] || issue.status}</span>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {ALL_STATUSES.map(s => (
                                                                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </div>

                                                    {/* Priority */}
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground mb-2 block">
                                                            Priority
                                                        </Label>
                                                        {edit ? (
                                                            <Select value={form.priority} onValueChange={(v) => handleChange("priority", v)}>
                                                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {ALL_PRIORITIES.map(p => (
                                                                        <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Select value={issue.priority} onValueChange={handleInlinePriorityChange} disabled={inlineSaving}>
                                                                <SelectTrigger className="h-9">
                                                                    <span className="text-xs">{PRIORITY_LABELS[issue.priority] || issue.priority}</span>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {ALL_PRIORITIES.map(p => (
                                                                        <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </div>
                                                </div>

                                                <Separator className="my-4" />

                                                {/* Project (mobile) */}
                                                <div className="mb-4">
                                                    <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                        <FolderKanban className="h-3 w-3" />
                                                        Project
                                                    </Label>
                                                    {edit ? (
                                                        <Select
                                                            value={form.projectId}
                                                            onValueChange={(v) => handleChange("projectId", v)}
                                                        >
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select project" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {projects.map((p) => (
                                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                                        {p.shortName}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <p className="text-sm font-mono">
                                                            {currentProject?.shortName || 'No project'}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Assignee */}
                                                <div className="mb-4">
                                                    <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3" />
                                                        Assignee
                                                    </Label>
                                                    {edit ? (
                                                        <Select
                                                            value={form.assigneeId}
                                                            onValueChange={(v) => handleChange("assigneeId", v)}
                                                        >
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Unassigned" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                                {users.map((user) => (
                                                                    <SelectItem key={user.id} value={String(user.id)}>
                                                                        {user.firstName} {user.lastName}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <p className="text-sm">
                                                            {assignedUser
                                                                ? `${assignedUser.firstName} ${assignedUser.lastName}`
                                                                : 'Unassigned'}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Team */}
                                                <div className="mb-4">
                                                    <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        Team
                                                    </Label>
                                                    {edit ? (
                                                        <Select
                                                            value={form.teamId}
                                                            onValueChange={(v) => handleChange("teamId", v)}
                                                        >
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="No team" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No team</SelectItem>
                                                                {teams.map((team) => (
                                                                    <SelectItem key={team.id} value={String(team.id)}>
                                                                        {team.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <p className="text-sm">
                                                            {issue.team?.name || 'No team'}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Due Date */}
                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Due Date
                                                    </Label>
                                                    {edit ? (
                                                        <Input
                                                            type="date"
                                                            value={form.dueDate}
                                                            onChange={(e) => handleChange("dueDate", e.target.value)}
                                                            className="h-9 [color-scheme:light] dark:[color-scheme:dark]"
                                                        />
                                                    ) : (
                                                        <p className="text-sm">
                                                            {issue.dueDate
                                                                ? new Date(issue.dueDate).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })
                                                                : 'No due date'}
                                                        </p>
                                                    )}
                                                </div>

                                                <Separator className="my-4" />

                                                {/* Labels */}
                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                        <Tag className="h-3 w-3" />
                                                        Labels
                                                    </Label>
                                                    {edit ? (
                                                        <LabelsSelect
                                                            labels={availableLabels}
                                                            selectedIds={form.labelIds}
                                                            onChange={(ids) => handleChange("labelIds", ids)}
                                                            placeholder="No labels"
                                                        />
                                                    ) : (
                                                        <IssueLabelChips labels={issue.labels || []} emptyText="No labels" />
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label className="text-base font-semibold mb-3 block">Description</Label>
                                        <Textarea
                                            rows={6}
                                            disabled={!edit}
                                            value={form.description}
                                            onChange={(e) => handleChange("description", e.target.value)}
                                            className={`min-h-[120px] md:min-h-[150px] ${!edit ? 'bg-muted/30' : ''}`}
                                            placeholder="Add a description..."
                                        />
                                    </div>

                                    <Separator />

                                    {/* Activity Tabs */}
                                    <Tabs defaultValue="comments">
                                        <TabsList className="mb-4">
                                            <TabsTrigger value="comments">Comments</TabsTrigger>
                                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="comments">
                                            <CommentSection issueId={issue.id} />
                                        </TabsContent>
                                        <TabsContent value="activity">
                                            <ActivityLog issueId={issue.id} />
                                        </TabsContent>
                                    </Tabs>
                                </div>

                                {/* Desktop Sidebar - Hidden on Mobile */}
                                <div className="hidden md:block w-[380px] border-l bg-muted/20 px-6 py-6">
                                    <div className="space-y-6">
                                        {/* Status */}
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                                                Status
                                            </Label>
                                            {edit ? (
                                                <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {ALL_STATUSES.map(s => (
                                                            <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Select value={issue.status} onValueChange={handleInlineStatusChange} disabled={inlineSaving}>
                                                    <SelectTrigger>
                                                        <span>{STATUS_LABELS[issue.status] || issue.status}</span>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ALL_STATUSES.map(s => (
                                                            <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Priority */}
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <Tag className="h-4 w-4" />
                                                Priority
                                            </Label>
                                            {edit ? (
                                                <Select value={form.priority} onValueChange={(v) => handleChange("priority", v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {ALL_PRIORITIES.map(p => (
                                                            <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Select value={issue.priority} onValueChange={handleInlinePriorityChange} disabled={inlineSaving}>
                                                    <SelectTrigger>
                                                        <span>{PRIORITY_LABELS[issue.priority] || issue.priority}</span>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ALL_PRIORITIES.map(p => (
                                                            <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Project */}
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <FolderKanban className="h-4 w-4" />
                                                Project
                                            </Label>
                                            {edit ? (
                                                <Select
                                                    value={form.projectId}
                                                    onValueChange={(v) => handleChange("projectId", v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select project" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {projects.map((p) => (
                                                            <SelectItem key={p.id} value={String(p.id)}>
                                                                {p.shortName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <p className="text-sm font-mono">
                                                    {currentProject?.shortName || 'No project'}
                                                </p>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Assignee */}
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <UserIcon className="h-4 w-4" />
                                                Assignee
                                            </Label>
                                            {edit ? (
                                                <Select
                                                    value={form.assigneeId}
                                                    onValueChange={(v) => handleChange("assigneeId", v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Unassigned" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                                        {users.map((user) => (
                                                            <SelectItem key={user.id} value={String(user.id)}>
                                                                {user.firstName} {user.lastName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <p className="text-sm">
                                                    {assignedUser
                                                        ? `${assignedUser.firstName} ${assignedUser.lastName}`
                                                        : 'Unassigned'}
                                                </p>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Team */}
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Team
                                            </Label>
                                            {edit ? (
                                                <Select
                                                    value={form.teamId}
                                                    onValueChange={(v) => handleChange("teamId", v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="No team" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No team</SelectItem>
                                                        {teams.map((team) => (
                                                            <SelectItem key={team.id} value={String(team.id)}>
                                                                {team.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <p className="text-sm">
                                                    {issue.team?.name || 'No team'}
                                                </p>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Due Date */}
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Due Date
                                            </Label>
                                            {edit ? (
                                                <Input
                                                    type="date"
                                                    value={form.dueDate}
                                                    onChange={(e) => handleChange("dueDate", e.target.value)}
                                                    className="[color-scheme:light] dark:[color-scheme:dark]"
                                                />
                                            ) : (
                                                <p className="text-sm">
                                                    {issue.dueDate
                                                        ? new Date(issue.dueDate).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })
                                                        : 'No due date'}
                                                </p>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Labels */}
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <Tag className="h-4 w-4" />
                                                Labels
                                            </Label>
                                            {edit ? (
                                                <LabelsSelect
                                                    labels={availableLabels}
                                                    selectedIds={form.labelIds}
                                                    onChange={(ids) => handleChange("labelIds", ids)}
                                                    placeholder="No labels"
                                                />
                                            ) : (
                                                <IssueLabelChips labels={issue.labels || []} emptyText="No labels" />
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Metadata */}
                                        <div className="pt-4">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Created {new Date(issue.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            </p>
                                            {issue.updatedAt && (
                                                <p className="text-xs text-muted-foreground">
                                                    Updated {new Date(issue.updatedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
