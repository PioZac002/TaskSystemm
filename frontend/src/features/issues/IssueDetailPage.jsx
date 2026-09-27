import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { CommentSection } from "@/components/comments/CommentSection";
import { ActivityLog } from "@/components/activity/ActivityLog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import apiClient from "@/services/apiClient";
import { useProjectStore } from "@/store/projectStore";
import { toast } from "sonner";
import { Save, X, Calendar, User as UserIcon, Users, Tag, FolderKanban } from "lucide-react";
import { EditButton } from "@/components/ui/EditButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { STATUS_LABELS, PRIORITY_LABELS, ALL_STATUSES, ALL_PRIORITIES, getStatusBadgeClass, getPriorityBadgeVariant } from "@/utils/issueConstants";

export default function IssueDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
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
    });

    const { projects, fetchProjects } = useProjectStore();

    useEffect(() => {
        if (id) {
            loadData();
            setEdit(false);
        }
        fetchProjects();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [issueRes, usersRes, teamsRes] = await Promise.all([
                apiClient.get(`/api/v1/issue/id/${id}`),
                apiClient.get("/api/v1/user/all"),
                apiClient.get("/api/v1/team/all"),
            ]);

            const issueData = issueRes.data;
            setIssue(issueData);
            setUsers(usersRes.data);
            setTeams(teamsRes.data);

            setForm({
                title: issueData.title || "",
                description: issueData.description || "",
                status: issueData.status || "NEW",
                priority: issueData.priority || "NORMAL",
                dueDate: issueData.dueDate ? issueData.dueDate.slice(0, 10) : "",
                assigneeId: issueData.assigneeId ? String(issueData.assigneeId) : "unassigned",
                teamId: issueData.team?.id ? String(issueData.team.id) : "none",
                projectId: issueData.projectId ? String(issueData.projectId) : "",
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

    const handleSave = async () => {
        try {
            if (!issue) return;
            setLoading(true);

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
            });

            toast.success("Issue updated successfully!");

            // Build full optimistic update from form — avoids calling loadData() which
            // overwrites state with potentially null status/priority from the API response
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
                updatedAt:  new Date().toISOString(),
            }));
            setEdit(false);
        } catch (error) {
            const errorMessage = error.response?.data?.Message || error.message || "Failed to update issue";
            toast.error(errorMessage);
            console.error('Update error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this issue? This action cannot be undone.")) {
            return;
        }
        try {
            await apiClient.delete(`/api/v1/issue/${issue.id}`);
            toast.success("Issue deleted successfully!");
            navigate('/issues');
        } catch (error) {
            const errorMessage = error.response?.data?.Message || error.message || "Failed to delete issue";
            toast.error(errorMessage);
        }
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
        } catch (e) {
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
        } catch (e) {
            toast.error("Failed to update priority");
        } finally {
            setInlineSaving(false);
        }
    };

    if (loading && !issue) {
        return (
            <AppLayout>
                <div className="py-12 text-center text-muted-foreground">Loading...</div>
            </AppLayout>
        );
    }

    if (!issue) return null;

    const assignedUser = users.find(u => u.id === issue?.assigneeId);
    const currentProject = projects.find(p => p.id === issue?.projectId);

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-mono text-muted-foreground">{issue.key}</span>
                                <Badge variant="secondary" className={`text-xs ${getStatusBadgeClass(issue.status)}`}>
                                    {STATUS_LABELS[issue.status] || issue.status}
                                </Badge>
                            </div>
                            {edit ? (
                                <Input
                                    value={form.title}
                                    onChange={(e) => handleChange("title", e.target.value)}
                                    className="text-xl font-semibold h-auto py-1"
                                />
                            ) : (
                                <h1 className="text-2xl md:text-3xl font-bold" title={issue.title}>
                                    {issue.title.length > 70 ? issue.title.slice(0, 70) + '…' : issue.title}
                                </h1>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                        {!edit ? (
                            <>
                                <EditButton onClick={() => setEdit(true)} disabled={loading} />
                                <DeleteButton onClick={handleDelete} disabled={loading} />
                            </>
                        ) : (
                            <>
                                <Button size="sm" onClick={handleSave} disabled={loading}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEdit(false)}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="md:flex gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        {/* Description */}
                        <div>
                            <Label className="text-base font-semibold mb-3 block">Description</Label>
                            <Textarea
                                rows={6}
                                disabled={!edit}
                                value={form.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                className={`min-h-[150px] ${!edit ? 'bg-muted/30' : ''}`}
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

                    {/* Sidebar */}
                    <div className="hidden md:block w-[320px] space-y-4">
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                {/* Status */}
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Status</Label>
                                    {edit ? (
                                        <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_STATUSES.map(s => (
                                                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : !isMobile ? (
                                        <Select value={issue.status} onValueChange={handleInlineStatusChange} disabled={inlineSaving}>
                                            <SelectTrigger className="w-full">
                                                <span>{STATUS_LABELS[issue.status] || issue.status}</span>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_STATUSES.map(s => (
                                                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Badge variant="secondary" className={getStatusBadgeClass(issue.status)}>
                                            {STATUS_LABELS[issue.status] || issue.status}
                                        </Badge>
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
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_PRIORITIES.map(p => (
                                                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : !isMobile ? (
                                        <Select value={issue.priority} onValueChange={handleInlinePriorityChange} disabled={inlineSaving}>
                                            <SelectTrigger className="w-full">
                                                <span>{PRIORITY_LABELS[issue.priority] || issue.priority}</span>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_PRIORITIES.map(p => (
                                                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Badge variant={getPriorityBadgeVariant(issue.priority)}>
                                            {PRIORITY_LABELS[issue.priority] || issue.priority}
                                        </Badge>
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
                                        <Select value={form.projectId} onValueChange={(v) => handleChange("projectId", v)}>
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
                                        <Select value={form.assigneeId} onValueChange={(v) => handleChange("assigneeId", v)}>
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
                                        <Select value={form.teamId} onValueChange={(v) => handleChange("teamId", v)}>
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
                                        <p className="text-sm">{issue.team?.name || 'No team'}</p>
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

                                {/* Metadata */}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Created {new Date(issue.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    {issue.updatedAt && (
                                        <p className="text-xs text-muted-foreground">
                                            Updated {new Date(issue.updatedAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
