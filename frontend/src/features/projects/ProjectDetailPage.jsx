import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Separator } from "@/components/ui/Separator";
import apiClient from "@/services/apiClient";
import { useProjectStore } from "@/store/projectStore";
import { toast } from "sonner";
import {
    Plus, ExternalLink, ListTodo, CheckCircle2, Clock,
    AlertCircle, Calendar, FolderKanban, Search, X
} from "lucide-react";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { STATUS_LABELS, PRIORITY_LABELS, ALL_STATUSES, ALL_PRIORITIES, getStatusBadgeClass, getPriorityBadgeVariant } from "@/utils/issueConstants";
import { IssueDetailsModal } from "@/components/modals/IssueDetailsModal";
import { CreateIssueModal } from "@/components/modals/CreateIssueModal";

function formatDate(dateString) {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { deleteProject } = useProjectStore();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [createIssueOpen, setCreateIssueOpen] = useState(false);
    const [issueSearch, setIssueSearch]         = useState("");
    const [issueStatus, setIssueStatus]         = useState("all");
    const [issuePriority, setIssuePriority]     = useState("all");

    useEffect(() => {
        if (id) loadProjectDetails();
    }, [id]);

    const handleDeleteProject = async () => {
        if (!window.confirm(`Are you sure you want to delete project "${project.shortName}"? This action cannot be undone.`)) return;
        try {
            await deleteProject(project.id);
            toast.success("Project deleted successfully!");
            navigate('/projects');
        } catch (e) {
            toast.error(e.response?.data?.Message || "Failed to delete project");
        }
    };

    const loadProjectDetails = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/v1/project/${id}`);
            setProject(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.Message || error.message || "Failed to load project details";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !project) {
        return (
            <AppLayout>
                <div className="py-12 text-center text-muted-foreground">Loading...</div>
            </AppLayout>
        );
    }

    if (!project) return null;

    const issues = project?.issues || [];
    const filteredIssues = issues.filter(i => {
        if (issueStatus !== "all" && i.status !== issueStatus) return false;
        if (issuePriority !== "all" && i.priority !== issuePriority) return false;
        if (issueSearch) {
            const s = issueSearch.toLowerCase();
            if (!(i.title?.toLowerCase().includes(s) || i.key?.toLowerCase().includes(s))) return false;
        }
        return true;
    });
    const hasFilters = issueSearch || issueStatus !== "all" || issuePriority !== "all";

    const todoIssues = issues.filter(i => i.status === 'NEW');
    const inProgressIssues = issues.filter(i => i.status === 'IN_PROGRESS');
    const doneIssues = issues.filter(i => i.status === 'DONE');
    const highPriorityIssues = issues.filter(i => i.priority === 'HIGH');
    const normalPriorityIssues = issues.filter(i => i.priority === 'NORMAL');
    const lowPriorityIssues = issues.filter(i => i.priority === 'LOW');
    const completionRate = issues.length > 0
        ? Math.round((doneIssues.length / issues.length) * 100)
        : 0;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <FolderKanban className="h-5 w-5 text-primary" />
                            <span className="text-sm font-mono text-muted-foreground">
                                {project.shortName}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold">{project.shortName}</h1>
                        {project.description && (
                            <p className="text-muted-foreground mt-1">{project.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button onClick={() => setCreateIssueOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Issue
                        </Button>
                        <DeleteButton onClick={handleDeleteProject} />
                    </div>
                </div>

                <div className="md:flex gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        {/* Progress Overview */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Project Progress</h3>
                                        <span className="text-2xl font-bold text-primary">{completionRate}%</span>
                                    </div>
                                    <Progress value={completionRate} className="h-3" />
                                    <div className="grid grid-cols-3 gap-4 pt-2">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-muted-foreground">{todoIssues.length}</div>
                                            <div className="text-xs text-muted-foreground">To Do</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{inProgressIssues.length}</div>
                                            <div className="text-xs text-muted-foreground">In Progress</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{doneIssues.length}</div>
                                            <div className="text-xs text-muted-foreground">Done</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Separator />

                        {/* Issues List */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold">
                                    Issues ({hasFilters ? `${filteredIssues.length} / ${issues.length}` : issues.length})
                                </h3>
                            </div>

                            {/* Filter toolbar */}
                            {issues.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <div className="relative flex-1 min-w-[160px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search issues…"
                                            value={issueSearch}
                                            onChange={(e) => setIssueSearch(e.target.value)}
                                            className="pl-8 h-9 text-sm"
                                        />
                                    </div>
                                    <Select value={issueStatus} onValueChange={setIssueStatus}>
                                        <SelectTrigger className="w-[130px] h-9 text-sm">
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All statuses</SelectItem>
                                            {ALL_STATUSES.map(s => (
                                                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={issuePriority} onValueChange={setIssuePriority}>
                                        <SelectTrigger className="w-[130px] h-9 text-sm">
                                            <SelectValue placeholder="All priorities" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All priorities</SelectItem>
                                            {ALL_PRIORITIES.map(p => (
                                                <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {hasFilters && (
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={() => { setIssueSearch(""); setIssueStatus("all"); setIssuePriority("all"); }}
                                            className="h-9 gap-1 text-muted-foreground hover:text-foreground px-2"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            <span className="text-xs">Clear</span>
                                        </Button>
                                    )}
                                </div>
                            )}

                            {issues.length === 0 ? (
                                <Card className="bg-muted/30">
                                    <CardContent className="py-12 text-center">
                                        <ListTodo className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                                        <p className="text-muted-foreground mb-3">No issues in this project yet</p>
                                        <Button variant="outline" size="sm" onClick={() => setCreateIssueOpen(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create First Issue
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : filteredIssues.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border py-10 text-center space-y-2">
                                    <ListTodo className="h-8 w-8 mx-auto text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">No issues match your filters</p>
                                    <Button variant="outline" size="sm" onClick={() => { setIssueSearch(""); setIssueStatus("all"); setIssuePriority("all"); }}>
                                        Clear Filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredIssues.map(issue => (
                                        <Card
                                            key={issue.id}
                                            className="hover:bg-accent cursor-pointer transition-all hover:shadow-md"
                                            onClick={() => setSelectedIssueId(issue.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs text-muted-foreground font-semibold">
                                                                {issue.key}
                                                            </span>
                                                            <h4 className="font-medium" title={issue.title}>
                                                {issue.title.length > 70 ? issue.title.slice(0, 70) + '…' : issue.title}
                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge
                                                                variant="secondary"
                                                                className={`text-xs ${getStatusBadgeClass(issue.status)}`}
                                                            >
                                                                {STATUS_LABELS[issue.status] || issue.status}
                                                            </Badge>
                                                            <Badge
                                                                variant={getPriorityBadgeVariant(issue.priority)}
                                                                className="text-xs"
                                                            >
                                                                {PRIORITY_LABELS[issue.priority] || issue.priority}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="hidden md:block w-[320px] space-y-6">
                        {/* Statistics */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Statistics</h3>
                            <div className="space-y-3">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <ListTodo className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Total Issues</p>
                                                <p className="text-lg font-bold">{issues.length}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-green-500/10">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Completed</p>
                                                <p className="text-lg font-bold">{doneIssues.length}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10">
                                                <Clock className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">In Progress</p>
                                                <p className="text-lg font-bold">{inProgressIssues.length}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <Separator />

                        {/* Priority Breakdown */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Priority Breakdown</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <span>High</span>
                                    </div>
                                    <span className="font-semibold">{highPriorityIssues.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                                        <span>Normal</span>
                                    </div>
                                    <span className="font-semibold">{normalPriorityIssues.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-gray-500" />
                                        <span>Low</span>
                                    </div>
                                    <span className="font-semibold">{lowPriorityIssues.length}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Project Details */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Project Details</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">Project Key</p>
                                    <p className="font-mono font-semibold">{project.shortName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Created
                                    </p>
                                    <p>{formatDate(project.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Project ID</p>
                                    <p className="font-mono text-xs">{project.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <IssueDetailsModal
                open={!!selectedIssueId}
                onOpenChange={() => setSelectedIssueId(null)}
                issueId={selectedIssueId}
                onIssueDeleted={() => {
                    setSelectedIssueId(null);
                    loadProjectDetails();
                }}
                onIssueUpdated={() => loadProjectDetails()}
            />

            <CreateIssueModal
                open={createIssueOpen}
                onOpenChange={setCreateIssueOpen}
                preSelectedProjectId={Number(id)}
                onIssueCreated={() => loadProjectDetails()}
            />
        </AppLayout>
    );
}
