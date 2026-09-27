import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { useUserStore } from "@/store/userStore";
import { useTeamStore } from "@/store/teamStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { GitBranch, MessageCircle, User, ArrowUpDown, Tag, FileText, Calendar, Users } from "lucide-react";
import { DeleteButton } from "@/components/ui/DeleteButton";

const PRIORITY_MAP = {
    "0": "LOW", "1": "NORMAL", "2": "HIGH", "3": "CRITICAL",
    "LOW": "Low", "NORMAL": "Normal", "HIGH": "High", "CRITICAL": "Critical",
};

const STATUS_MAP = {
    "0": "New", "1": "In Progress", "3": "Done",
    "NEW": "New",
    "TRIAGE": "Triage",
    "TODO": "To Do",
    "IN_PROGRESS": "In Progress",
    "WAITING_FOR_TEAM": "Waiting for Team",
    "CODE_REVIEW": "Code Review",
    "DONE": "Done",
    "CANCELED": "Canceled",
};

function formatLabel(map, val) {
    return map[String(val)] ?? val ?? "—";
}

function getActivityDescription(activity, users, teams) {
    const { activityType, eventAuthorUserId } = activity;
    const author = users.find(u => u.id === eventAuthorUserId || String(u.id) === String(eventAuthorUserId));
    const authorName = author
        ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email
        : `User #${eventAuthorUserId}`;

    switch (activityType) {
        case "CREATED_ISSUE":
            return { text: "Created this issue", authorName, icon: GitBranch, color: "bg-green-500" };
        case "CREATED_COMMENT":
            return { text: "Added a comment", authorName, icon: MessageCircle, color: "bg-blue-500" };
        case "UPDATED_ASSIGNEE": {
            const { oldValue, newValue } = activity;
            const oldUser = users.find(u => u.id === Number(oldValue) || String(u.id) === String(oldValue));
            const newUser = users.find(u => u.id === Number(newValue) || String(u.id) === String(newValue));
            const oldName = oldUser ? `${oldUser.firstName || ''} ${oldUser.lastName || ''}`.trim() : (oldValue || "Unassigned");
            const newName = newUser ? `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() : (newValue || "Unassigned");
            return { text: `Changed assignee: ${oldName} → ${newName}`, authorName, icon: User, color: "bg-purple-500" };
        }
        case "UPDATED_PRIORITY":
            return {
                text: `Changed priority: ${formatLabel(PRIORITY_MAP, activity.oldPriority)} → ${formatLabel(PRIORITY_MAP, activity.newPriority)}`,
                authorName, icon: ArrowUpDown, color: "bg-orange-500"
            };
        case "UPDATED_STATUS":
            return {
                text: `Changed status: ${formatLabel(STATUS_MAP, activity.oldStatus)} → ${formatLabel(STATUS_MAP, activity.newStatus)}`,
                authorName, icon: ArrowUpDown, color: "bg-cyan-500"
            };
        case "UPDATED_TEAM": {
            const oldTeam = activity.oldTeamId === -1 ? null : teams.find(t => t.id === activity.oldTeamId);
            const newTeam = teams.find(t => t.id === activity.newTeamId);
            const oldName = oldTeam ? oldTeam.name : "None";
            const newName = newTeam ? newTeam.name : `Team #${activity.newTeamId}`;
            return { text: `Changed team: ${oldName} → ${newName}`, authorName, icon: Users, color: "bg-indigo-500" };
        }
        case "UPDATED_DUEDATE": {
            const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "None";
            return {
                text: `Changed due date: ${fmt(activity.oldDateTime)} → ${fmt(activity.newDateTime)}`,
                authorName, icon: Calendar, color: "bg-yellow-500"
            };
        }
        case "UPDATED_TITLE":
            return {
                text: `Changed title: "${activity.oldValue}" → "${activity.newValue}"`,
                authorName, icon: Tag, color: "bg-pink-500"
            };
        case "UPDATED_DESCRIPTION":
            return { text: "Updated description", authorName, icon: FileText, color: "bg-teal-500" };
        default:
            return { text: activityType, authorName, icon: GitBranch, color: "bg-muted-foreground" };
    }
}

export function ActivityLog({ issueId }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { users, fetchUsers } = useUserStore();
    const { teams, fetchTeams } = useTeamStore();
    const isAdmin = useAuthStore((state) => state.isAdmin);
    const isAdminUser = isAdmin();

    useEffect(() => {
        fetchUsers();
        fetchTeams();
        apiClient.get(`/api/v1/issue/${issueId}/activities`)
            .then(r => setActivities(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [issueId]);

    const handleDeleteActivity = async (activityId) => {
        if (!window.confirm("Delete this activity entry?")) return;
        try {
            await apiClient.delete(`/api/v1/admin/activity/issue/${activityId}`);
            setActivities(prev => prev.filter(a => a.id !== activityId));
            toast.success("Activity deleted");
        } catch (e) {
            toast.error(e.response?.data?.Message || "Failed to delete activity");
        }
    };

    if (loading) {
        return <p className="text-sm text-muted-foreground py-4">Loading activity...</p>;
    }

    if (!activities.length) {
        return <p className="text-sm text-muted-foreground py-4">No activity recorded yet.</p>;
    }

    return (
        <div className="relative ml-3 border-l-2 border-border space-y-0">
            {activities.map((activity, i) => {
                const { text, authorName, icon: Icon, color } = getActivityDescription(activity, users, teams);
                const timestamp = activity.timestamp
                    ? new Date(activity.timestamp).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })
                    : "";

                return (
                    <div key={i} className="relative pl-6 pb-4 group">
                        {/* Dot */}
                        <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ${color} flex items-center justify-center`}>
                            <Icon className="h-2.5 w-2.5 text-white" />
                        </span>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm">
                                    <span className="font-medium">{authorName}</span>{" "}
                                    <span className="text-muted-foreground">{text}</span>
                                </p>
                                {timestamp && (
                                    <p className="text-xs text-muted-foreground">{timestamp}</p>
                                )}
                            </div>
                            {isAdminUser && activity.id && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DeleteButton onClick={() => handleDeleteActivity(activity.id)} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
