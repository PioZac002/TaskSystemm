import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useTeamStore } from "@/store/teamStore";
import { toast } from "sonner";

export function CreateTeamModal({ open, onOpenChange }) {
    const [name, setName] = useState("");
    const createTeam = useTeamStore((state) => state.createTeam);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || name.trim().length < 3) {
            toast.error("Team name must be at least 3 characters");
            return;
        }
        try {
            await createTeam({ name });
            toast.success("Team created successfully");
            setName("");
            onOpenChange(false);
        } catch (error) {
            toast.error(error.message || "Failed to create team");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] animate-scale-in">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Create New Team</DialogTitle>
                    <DialogDescription>
                        Add a new team to your workspace
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Team Name *</Label>
                        <Input
                            id="name"
                            placeholder="Development Team"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="gradient" className="flex-1">
                            Create Team
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
