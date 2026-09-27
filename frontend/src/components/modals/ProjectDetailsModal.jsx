import { useEffect, useState } from "react";
import { useResponsiveNavigation } from "@/hooks/useResponsiveNavigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Separator } from "@/components/ui/Separator";
import apiClient from "@/services/apiClient";
import { useProjectStore } from "@/store/projectStore";
import { toast } from "sonner";
import { Plus, ExternalLink, ListTodo, CheckCircle2, Clock, AlertCircle, Calendar, FolderKanban } from "lucide-react";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { IssueDetailsModal } from "./IssueDetailsModal";
import { CreateIssueModal } from "./CreateIssueModal";

function formatDate(dateString) {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export function ProjectDetailsModal({ open, onOpenChange, projectId, onProjectUpdate }) {
    const { isMobile } = useResponsiveNavigation();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [createIssueOpen, setCreateIssueOpen] = useState(false);
    const { deleteProject } = useProjectStore();

    const handleDeleteProject = async () => {
        if (!window.confirm(`Are you sure you want to delete project "${project.shortName}"? This action cannot be undone.`)) return;
        try {
            await deleteProject(project.id);
            toast.success("Project deleted successfully!");
            onOpenChange(false);
            if (onProjectUpdate) onProjectUpdate();
        } catch (e) {
            toast.error(e.response?.data?.Message || "Failed to delete project");
        }
    };

    useEffect(() => {
        if (open && projectId) {
            loadProjectDetails();
        }
    }, [open, projectId]);

    const loadProjectDetails = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/v1/project/${projectId}`);
            setProject(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.Message || error.message || "Failed to load project details";
            toast.error(errorMessage);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!project && !loading) return null;

    const issues = project?.issues || [];
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
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[95vw] w-full md:max-w-[1400px] h-[95vh] overflow-hidden p-0 flex flex-col">
                    {loading && !project ? (
                        <div className="py-12 text-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : (
                        <>
                            {/* Header - Sticky */}
                            <div className="shrink-0 bg-background border-b px-4 md:px-6 py-3 md:py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                                            <FolderKanban className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                                            <span className="text-xs md:text-sm font-mono text-muted-foreground">
                                                {project.shortName}
                                            </span>
                                        </div>
                                        <DialogTitle className="text-lg md:text-2xl font-bold">
                                            {project.shortName}
                                        </DialogTitle>
                                        {project.description && (
                                            <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {project.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 shrink-0 mr-8">
                                        <Button onClick={() => setCreateIssueOpen(true)} size="sm">
                                            <Plus className="h-4 w-4 md:mr-2" />
                                            <span className="hidden md:inline">Add Issue</span>
                                        </Button>
                                        <DeleteButton onClick={handleDeleteProject} />
                                    </div>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto">
                                {/* Mobile: Single Column, Desktop: Two Columns */}
                                <div className="md:flex md:min-h-full">
                                    {/* Main Content */}
                                    <div className="flex-1 px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
                                        {/* Progress Overview */}
                                        <Card>
                                            <CardContent className="p-4 md:pt-6">
                                                <div className="space-y-3 md:space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-base md:text-lg font-semibold">Project Progress</h3>
                                                        <span className="text-xl md:text-2xl font-bold text-primary">
                                                            {completionRate}%
                                                        </span>
                                                    </div>
                                                    <Progress value={completionRate} className="h-2 md:h-3" />
                                                    <div className="grid grid-cols-3 gap-2 md:gap-4 pt-2">
                                                        <div className="text-center">
                                                            <div className="text-lg md:text-2xl font-bold text-muted-foreground">
                                                                {todoIssues.length}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">To Do</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-lg md:text-2xl font-bold text-blue-600">
                                                                {inProgressIssues.length}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">In Progress</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-lg md:text-2xl font-bold text-green-600">
                                                                {doneIssues.length}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">Done</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Mobile: Stats Cards */}
                                        <div className="grid grid-cols-2 gap-3 md:hidden">
                                            <Card>
                                                <CardContent className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                        <div className="flex-1">
                                                            <p className="text-xs text-muted-foreground">High</p>
                                                            <p className="text-lg font-bold">{highPriorityIssues.length}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                                                        <div className="flex-1">
                                                            <p className="text-xs text-muted-foreground">Normal</p>
                                                            <p className="text-lg font-bold">{normalPriorityIssues.length}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Separator className="md:my-6" />

                                        {/* Issues List */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3 md:mb-4">
                                                <h3 className="text-base md:text-lg font-semibold">
                                                    Issues ({issues.length})
                                                </h3>
                                            </div>

                                            {issues.length === 0 ? (
                                                <Card className="bg-muted/30">
                                                    <CardContent className="py-8 md:py-12 text-center">
                                                        <ListTodo className="mx-auto h-10 md:h-12 w-10 md:w-12 text-muted-foreground mb-3" />
                                                        <p className="text-sm text-muted-foreground mb-3">
                                                            No issues in this project yet
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCreateIssueOpen(true)}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Create First Issue
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <div className="space-y-2">
                                                    {issues.map(issue => (
                                                        <Card
                                                            key={issue.id}
                                                            className="hover:bg-accent cursor-pointer transition-all hover:shadow-md"
                                                            onClick={() => setSelectedIssueId(issue.id)}
                                                        >
                                                            <CardContent className="p-3 md:p-4">
                                                                <div className="flex items-start justify-between gap-3 md:gap-4">
                                                                    <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-mono text-xs text-muted-foreground font-semibold">
                                                                                {issue.key}
                                                                            </span>
                                                                            <h4 className="font-medium text-sm md:text-base" title={issue.title}>
                                                                                {isMobile
                                                                                    ? (issue.title.length > 30 ? issue.title.slice(0, 30) + '…' : issue.title)
                                                                                    : issue.title}
                                                                            </h4>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <Badge
                                                                                variant={
                                                                                    issue.status === 'DONE' ? 'default' :
                                                                                        issue.status === 'IN_PROGRESS' ? 'secondary' :
                                                                                            'outline'
                                                                                }
                                                                                className="text-xs"
                                                                            >
                                                                                {issue.status === 'NEW' ? 'To Do' :
                                                                                    issue.status === 'IN_PROGRESS' ? 'In Progress' :
                                                                                        'Done'}
                                                                            </Badge>
                                                                            <Badge
                                                                                variant={
                                                                                    issue.priority === 'HIGH' ? 'destructive' :
                                                                                        issue.priority === 'NORMAL' ? 'secondary' :
                                                                                            'outline'
                                                                                }
                                                                                className="text-xs"
                                                                            >
                                                                                {issue.priority}
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

                                    {/* Desktop Sidebar - Hidden on Mobile */}
                                    <div className="hidden md:block w-[380px] border-l bg-muted/20 px-6 py-6">
                                        <div className="space-y-6">
                                            {/* Statistics Cards */}
                                            <div>
                                                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                                                    Statistics
                                                </h3>
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
                                                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                                                    Priority Breakdown
                                                </h3>
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
                                                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                                                    Project Details
                                                </h3>
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
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Nested Modals */}
            <IssueDetailsModal
                open={!!selectedIssueId}
                onOpenChange={() => setSelectedIssueId(null)}
                issueId={selectedIssueId}
                onIssueDeleted={() => {
                    setSelectedIssueId(null);
                    loadProjectDetails();
                    if (onProjectUpdate) onProjectUpdate();
                }}
                onIssueUpdated={() => {
                    loadProjectDetails();
                    if (onProjectUpdate) onProjectUpdate();
                }}
            />

            <CreateIssueModal
                open={createIssueOpen}
                onOpenChange={setCreateIssueOpen}
                preSelectedProjectId={projectId}
                onIssueCreated={() => {
                    loadProjectDetails();
                    if (onProjectUpdate) onProjectUpdate();
                }}
            />
        </>
    );
}