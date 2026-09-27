import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { useProjectStore } from "@/store/projectStore";
import { FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CreateProjectModal({ open, onOpenChange }) {
    const [shortName, setShortName]     = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading]         = useState(false);
    const createProject = useProjectStore((state) => state.createProject);

    const isValid = /^[A-Z]{6}$/.test(shortName);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!shortName.trim()) { toast.error("Project short name is required"); return; }
        if (!isValid)           { toast.error("Short name must be exactly 6 uppercase letters (A-Z only)"); return; }

        setLoading(true);
        try {
            await createProject({
                shortName:   shortName.trim().toUpperCase(),
                description: description.trim() || null,
            });
            toast.success("Project created successfully!");
            setShortName("");
            setDescription("");
            onOpenChange(false);
        } catch (error) {
            toast.error(error.response?.data?.Message || error.message || "Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    const handleShortNameChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
        if (value.length <= 6) setShortName(value);
    };

    const handleClose = () => {
        if (!loading) {
            setShortName("");
            setDescription("");
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
                {/* Accent top strip */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/60" />

                <div className="px-6 pt-5 pb-6">
                    <DialogHeader className="mb-5">
                        <DialogTitle className="flex items-center gap-2.5 text-base">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                                <FolderKanban className="h-3.5 w-3.5 text-white" />
                            </div>
                            New Project
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Short Name */}
                        <div className="space-y-2">
                            <Label htmlFor="shortName" className="flex items-center justify-between text-sm">
                                <span>
                                    Short Name
                                    <span className="text-destructive ml-0.5">*</span>
                                </span>
                                <span className={cn(
                                    "text-xs tabular-nums font-medium transition-colors",
                                    shortName.length === 6 ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {shortName.length}/6
                                </span>
                            </Label>

                            <div className="flex items-center gap-2">
                                <Input
                                    id="shortName"
                                    placeholder="PROJAB"
                                    value={shortName}
                                    onChange={handleShortNameChange}
                                    maxLength={6}
                                    required
                                    autoFocus
                                    className="font-mono uppercase tracking-widest text-base h-10"
                                />
                                {/* Live preview badge */}
                                <div className={cn(
                                    "shrink-0 h-10 min-w-[4rem] px-2.5 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-xs tracking-wider transition-all duration-200",
                                    isValid
                                        ? "border-primary text-primary bg-primary/5"
                                        : "border-border text-muted-foreground bg-muted/30"
                                )}>
                                    {shortName || "——"}
                                </div>
                            </div>

                            {/* Character progress bar */}
                            <div className="h-0.5 rounded-full bg-border overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-200",
                                        isValid ? "bg-primary" : "bg-muted-foreground/50"
                                    )}
                                    style={{ width: `${(shortName.length / 6) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Exactly 6 uppercase letters (A–Z only), e.g. <span className="font-mono font-medium">MYAPP</span>
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center justify-between text-sm">
                                Description
                                <span className="text-xs text-muted-foreground font-normal">Optional</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Describe what this project is about…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="resize-none text-sm"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={loading || !isValid}
                                className="gap-1.5 min-w-[130px]"
                            >
                                {loading ? (
                                    <>
                                        <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                                        Creating…
                                    </>
                                ) : (
                                    <>
                                        <FolderKanban className="h-3.5 w-3.5" />
                                        Create Project
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
