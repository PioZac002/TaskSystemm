import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useIssueStore } from "@/store/issueStore";
import { useProjectStore } from "@/store/projectStore";
import { useUserStore } from "@/store/userStore";
import { useTeamStore } from "@/store/teamStore";
import { useAuthStore } from "@/store/authStore";
import { useMasterdataStore } from "@/store/masterdataStore";
import { storageService } from "@/services/storageService";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import { CheckSquare, Image, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { LabelsSelect } from "@/components/ui/LabelsSelect";
import { labelIdsToMasterdataValues } from "@/utils/labelUtils";

/**
 * CreateIssueModal — create a new issue
 */
export function CreateIssueModal({ open, onOpenChange, preSelectedProjectId = null, onIssueCreated }) {
    const [title,           setTitle]           = useState("");
    const [description,     setDescription]     = useState("");
    const [priority,        setPriority]        = useState("NORMAL");
    const [projectId,       setProjectId]       = useState(preSelectedProjectId ? String(preSelectedProjectId) : "");
    const [assigneeId,      setAssigneeId]      = useState("unassigned");
    const [teamId,          setTeamId]          = useState("none");
    const [dueDate,         setDueDate]         = useState("");
    const [loading,         setLoading]         = useState(false);
    const [attachedImages,  setAttachedImages]  = useState([]);
    const [labelIds,        setLabelIds]        = useState([]);
    const [availableLabels, setAvailableLabels] = useState([]);
    const fileInputRef = useRef(null);

    const { createIssue, fetchIssues } = useIssueStore();
    const { projects, fetchProjects }  = useProjectStore();
    const { users, fetchUsers }        = useUserStore();
    const { teams, fetchTeams }        = useTeamStore();
    const user = useAuthStore((state) => state.user);
    const { fetchByType } = useMasterdataStore();

    useEffect(() => {
        if (open) {
            fetchProjects();
            fetchUsers();
            fetchTeams();
            fetchByType('ISSUE_LABEL').then(setAvailableLabels);
            if (preSelectedProjectId) setProjectId(String(preSelectedProjectId));
        } else {
            setAttachedImages([]);
            setLabelIds([]);
        }
    }, [open, preSelectedProjectId]);

    // Global paste handler for clipboard images
    const handleGlobalPaste = useCallback((e) => {
        if (!open) return;
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) addImage(file);
            }
        }
    }, [open]);

    useEffect(() => {
        window.addEventListener("paste", handleGlobalPaste);
        return () => window.removeEventListener("paste", handleGlobalPaste);
    }, [handleGlobalPaste]);

    const addImage = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setAttachedImages(prev => [
                ...prev,
                { file, url: e.target.result, name: file.name || `image-${Date.now()}.png` },
            ]);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (index) => setAttachedImages(prev => prev.filter((_, i) => i !== index));

    const handleFileUpload = (e) => {
        Array.from(e.target.files).filter(f => f.type.startsWith("image/")).forEach(addImage);
        e.target.value = "";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")).forEach(addImage);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim())              { toast.error("Title is required"); return; }
        if (!projectId || projectId === "") { toast.error("Please select a project"); return; }

        let authorId = null;
        if (user?.id) {
            authorId = user.id;
        } else if (storageService.getItem("userId")) {
            authorId = Number(storageService.getItem("userId"));
        } else if (storageService.getItem("user")) {
            try { authorId = JSON.parse(storageService.getItem("user"))?.id; } catch {}
        }
        if (!authorId) { toast.error("You must be logged in to create an issue"); return; }

        setLoading(true);
        try {
            const masterDataValues = labelIdsToMasterdataValues(availableLabels, labelIds);
            const payload = {
                title:       title.trim(),
                description: description.trim() || null,
                priority:    priority || null,
                authorId,
                assigneeId:  null,
                dueDate:     null,
                projectId:   Number(projectId),
            };
            if (assigneeId && assigneeId !== "unassigned") {
                const n = Number(assigneeId);
                if (!isNaN(n) && n > 0) payload.assigneeId = n;
            }
            if (dueDate) payload.dueDate = dueDate;

            const createdIssue = await createIssue(payload);

            let resolvedTeamId = Number(createdIssue?.teamId) > 0 ? Number(createdIssue.teamId) : null;
            if (teamId && teamId !== "none") {
                const n = Number(teamId);
                if (!isNaN(n) && n > 0) {
                    try {
                        await apiClient.put("/api/v1/issue/assign-team", { issueId: createdIssue.id, teamId: n });
                        resolvedTeamId = n;
                    } catch {
                        toast.warning("Issue created, but failed to assign team");
                    }
                }
            }

            if (masterDataValues.length > 0 && createdIssue?.id) {
                try {
                    await apiClient.put("/api/v1/issue/update", {
                        issueId: Number(createdIssue.id),
                        title: createdIssue.title ?? payload.title ?? null,
                        description: createdIssue.description ?? payload.description ?? null,
                        status: createdIssue.status ?? "NEW",
                        priority: createdIssue.priority ?? payload.priority ?? null,
                        teamId: resolvedTeamId,
                        projectId: createdIssue.projectId ?? payload.projectId ?? null,
                        dueDate: createdIssue.dueDate ? createdIssue.dueDate.slice(0, 10) : (payload.dueDate ?? null),
                        assigneeId: Number(createdIssue.assigneeId) > 0
                            ? Number(createdIssue.assigneeId)
                            : (payload.assigneeId ?? null),
                        masterDataValues,
                    });
                } catch {
                    toast.warning("Issue created, but failed to assign labels");
                }
            }

            if (attachedImages.length > 0 && createdIssue.id) {
                let uploaded = 0;
                for (const img of attachedImages) {
                    try {
                        const fd = new FormData();
                        fd.append("file", img.file);
                        await apiClient.post(`/api/v1/issue/${createdIssue.id}/attachments`, fd, {
                            headers: { "Content-Type": "multipart/form-data" },
                        });
                        uploaded++;
                    } catch {}
                }
                toast.success(uploaded > 0 ? `Issue created with ${uploaded} attachment(s)!` : "Issue created successfully!");
                if (uploaded === 0 && attachedImages.length > 0) toast.warning("Image attachments could not be uploaded");
            } else {
                toast.success("Issue created successfully!");
            }

            // Reset
            setTitle(""); setDescription(""); setPriority("NORMAL");
            setProjectId(preSelectedProjectId ? String(preSelectedProjectId) : "");
            setAssigneeId("unassigned"); setTeamId("none"); setDueDate(""); setAttachedImages([]); setLabelIds([]);

            await fetchIssues();
            if (onIssueCreated) onIssueCreated();
            onOpenChange(false);
        } catch (error) {
            toast.error(error.response?.data?.Message || error.message || "Failed to create issue");
        } finally {
            setLoading(false);
        }
    };

    const priorityOptions = [
        { value: "CRITICAL", label: "Critical", color: "bg-red-500"    },
        { value: "HIGH",     label: "High",     color: "bg-orange-500" },
        { value: "NORMAL",   label: "Normal",   color: "bg-yellow-500" },
        { value: "LOW",      label: "Low",      color: "bg-green-500"  },
    ];

    const canSubmit = title.trim() && projectId && projectId !== "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[95vw] md:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
                {/* Accent top strip */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/60 shrink-0" />

                <div className="px-6 pt-5 pb-6">
                    <DialogHeader className="mb-5">
                        <DialogTitle className="flex items-center gap-2.5 text-base">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                                <CheckSquare className="h-3.5 w-3.5 text-white" />
                            </div>
                            New Issue
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-sm">
                                Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Describe the issue briefly…"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                                required
                                className="h-10"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="flex items-center justify-between text-sm">
                                Description
                                <span className="text-xs text-muted-foreground font-normal">Optional</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Provide more context, steps to reproduce, etc…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="resize-none text-sm"
                            />
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <Label className="flex items-center justify-between text-sm">
                                Attachments
                                <span className="text-xs text-muted-foreground font-normal">Optional</span>
                            </Label>
                            <div
                                className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                <Upload className="mx-auto h-6 w-6 text-muted-foreground/60 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Drop images here or{" "}
                                    <span className="text-primary font-medium">click to upload</span>
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    Or paste with{" "}
                                    <kbd className="px-1 py-0.5 rounded border text-[10px] font-mono bg-muted">Ctrl+V</kbd>
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            {attachedImages.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {attachedImages.map((img, i) => (
                                        <div key={i} className="relative group">
                                            <img
                                                src={img.url}
                                                alt={img.name}
                                                className="h-16 w-16 object-cover rounded-lg border border-border"
                                            />
                                            <button
                                                type="button"
                                                className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                onClick={() => removeImage(i)}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 w-16 truncate">{img.name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Project + Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="project" className="text-sm">
                                    Project <span className="text-destructive">*</span>
                                </Label>
                                <Select value={projectId} onValueChange={setProjectId} required>
                                    <SelectTrigger className={cn(!projectId && "text-muted-foreground")}>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={String(p.id)}>{p.shortName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="priority" className="text-sm">Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorityOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("h-2 w-2 rounded-full shrink-0", opt.color)} />
                                                    {opt.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Assignee + Team */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="assignee" className="flex items-center justify-between text-sm">
                                    Assignee
                                    <span className="text-xs text-muted-foreground font-normal">Optional</span>
                                </Label>
                                <Select value={assigneeId} onValueChange={setAssigneeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Unassigned" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {users.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.firstName} {u.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="team" className="flex items-center justify-between text-sm">
                                    Team
                                    <span className="text-xs text-muted-foreground font-normal">Optional</span>
                                </Label>
                                <Select value={teamId} onValueChange={setTeamId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="No team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No team</SelectItem>
                                        {teams.map(t => (
                                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="dueDate" className="flex items-center justify-between text-sm">
                                Due Date
                                <span className="text-xs text-muted-foreground font-normal">Optional</span>
                            </Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="h-10 [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>

                        {/* Labels */}
                        {availableLabels.length > 0 && (
                            <div className="space-y-1.5">
                                <Label className="flex items-center justify-between text-sm">
                                    Labels
                                    <span className="text-xs text-muted-foreground font-normal">Optional</span>
                                </Label>
                                <LabelsSelect
                                    labels={availableLabels}
                                    selectedIds={labelIds}
                                    onChange={setLabelIds}
                                    placeholder="No labels"
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={loading || !canSubmit}
                                className="gap-1.5 min-w-[120px]"
                            >
                                {loading ? (
                                    <>
                                        <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                                        Creating…
                                    </>
                                ) : (
                                    <>
                                        <CheckSquare className="h-3.5 w-3.5" />
                                        Create Issue
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
