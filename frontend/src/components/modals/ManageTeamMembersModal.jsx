import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Separator } from "@/components/ui/Separator";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useTeamStore } from "@/store/teamStore";
import { useUserStore } from "@/store/userStore";
import teamApi from "@/services/teamApi";
import { toast } from "@/hooks/use-toast";
import { UserMinus, UserPlus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";

export function ManageTeamMembersModal({ open, onOpenChange, teamId }) {
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [loading, setLoading] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [userToRemove, setUserToRemove] = useState(null);
    
    const users = useUserStore((state) => state.users);
    const fetchUsers = useUserStore((state) => state.fetchUsers);
    const addUserToTeam = useTeamStore((state) => state.addUserToTeam);
    const removeUserFromTeam = useTeamStore((state) => state.removeUserFromTeam);

    useEffect(() => {
        if (open && teamId) {
            loadTeamMembers();
            fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, teamId]);

    const loadTeamMembers = async () => {
        try {
            const members = await teamApi.getUsersByTeamId(teamId);
            setTeamMembers(members);
        } catch {
            toast({ 
                title: "Error", 
                description: "Failed to load team members", 
                variant: "destructive" 
            });
        }
    };

    const handleAddUser = async () => {
        if (!selectedUserId) {
            toast({ 
                title: "Error", 
                description: "Please select a user", 
                variant: "destructive" 
            });
            return;
        }
        setLoading(true);
        try {
            await addUserToTeam(teamId, parseInt(selectedUserId));
            await loadTeamMembers();
            setSelectedUserId("");
            toast({ title: "Success", description: "User added to team" });
        } catch (error) {
            toast({ 
                title: "Error", 
                description: error.message || "Failed to add user", 
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmRemoveUser = (user) => {
        setUserToRemove(user);
        setRemoveDialogOpen(true);
    };

    const handleRemoveUser = async () => {
        if (!userToRemove) return;
        setLoading(true);
        try {
            await removeUserFromTeam(teamId, userToRemove.id);
            await loadTeamMembers();
            toast({ title: "Success", description: "User removed from team" });
        } catch (error) {
            toast({ 
                title: "Error", 
                description: error.message || "Failed to remove user", 
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
            setRemoveDialogOpen(false);
            setUserToRemove(null);
        }
    };

    const availableUsers = users.filter(
        user => !teamMembers.some(member => member.id === user.id)
    );

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] animate-scale-in">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Manage Team Members</DialogTitle>
                        <DialogDescription>
                            Add or remove members from the team
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 mt-4">
                        {/* Current Members Section */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3">
                                Current Members ({teamMembers.length})
                            </h3>
                            <ScrollArea className="h-[250px] border rounded-md p-4">
                                {teamMembers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No members in this team yet
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {teamMembers.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                                            {getInitials(member.firstName, member.lastName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {member.firstName} {member.lastName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {member.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => confirmRemoveUser(member)}
                                                    disabled={loading}
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        <Separator />

                        {/* Add Member Section */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3">Add Member</h3>
                            <div className="flex gap-3">
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select a user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUsers.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                No available users
                                            </div>
                                        ) : (
                                            availableUsers.map((user) => (
                                                <SelectItem key={user.id} value={String(user.id)}>
                                                    {user.firstName} {user.lastName} ({user.email})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button 
                                    onClick={handleAddUser} 
                                    disabled={loading || !selectedUserId}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {userToRemove?.firstName} {userToRemove?.lastName} from this team?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveUser}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
