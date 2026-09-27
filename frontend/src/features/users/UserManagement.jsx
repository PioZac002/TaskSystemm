import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useUserStore } from "@/store/userStore";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/services/apiClient";
import { Search, Trash2, KeyRound, Shield, UserCircle, ArrowUpDown, Info } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/utils/formatters";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

// ─── Role helpers ──────────────────────────────────────────────────────────────
const getUserRoles = (user) => user.roles || (user.role ? [user.role] : []);
const isUserAdmin  = (user) => getUserRoles(user).some(r =>
    r === "ROLE_ADMIN" || r?.authority === "ROLE_ADMIN"
);
const getRoleLabel = (user) => isUserAdmin(user) ? "Admin" : "User";

// ─── User row ─────────────────────────────────────────────────────────────────
function UserRow({ user, onResetPassword, onChangeRole, onDelete, onPreview }) {
    const admin    = isUserAdmin(user);
    const initials = getInitials(user.firstName, user.lastName);
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "—";

    return (
        <div className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-border/80 hover:shadow-sm transition-all duration-150">
            {/* Avatar */}
            <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className={cn(
                    "text-sm font-semibold",
                    admin
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                        : "bg-primary/10 text-primary"
                )}>
                    {initials}
                </AvatarFallback>
            </Avatar>

            {/* Info — tappable on mobile to show preview */}
            <button
                type="button"
                className="flex-1 min-w-0 text-left"
                onClick={() => onPreview(user)}
                title="View user details"
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-sm text-foreground truncate">{fullName}</span>
                    <Badge
                        variant="secondary"
                        className={cn(
                            "shrink-0 text-[10px] font-medium",
                            admin && "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                        )}
                    >
                        {getRoleLabel(user)}
                    </Badge>
                    {user.disabled && (
                        <Badge variant="outline" className="shrink-0 text-[10px] text-destructive border-destructive/40">
                            Disabled
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email || "—"}</p>
            </button>

            {/* ID */}
            <Badge variant="outline" className="shrink-0 text-[10px] hidden sm:flex tabular-nums">
                #{user.id}
            </Badge>

            {/* Actions */}
            <div className="flex items-center gap-0.5 shrink-0">
                <Button
                    size="sm" variant="ghost"
                    onClick={() => onPreview(user)}
                    title="View details"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground sm:hidden"
                >
                    <Info className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="sm" variant="ghost"
                    onClick={() => onResetPassword(user)}
                    title="Reset password"
                    className="hidden sm:flex h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                    <KeyRound className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="sm" variant="ghost"
                    onClick={() => onChangeRole(user)}
                    title="Change role"
                    className="hidden sm:flex h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                    <Shield className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="sm" variant="ghost"
                    onClick={() => onDelete(user)}
                    title="Delete user"
                    className="h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function UserManagement() {
    const { users, fetchUsers, deleteUser, loading } = useUserStore();

    const [searchTerm, setSearchTerm]   = useState("");
    const [sortField, setSortField]     = useState("id");
    const [sortOrder, setSortOrder]     = useState("asc");

    const [resetPasswordDialog, setResetPasswordDialog] = useState({ open: false, user: null });
    const [resetNewPassword, setResetNewPassword]       = useState("");
    const [resetConfirmPassword, setResetConfirmPassword] = useState("");
    const [resetLoading, setResetLoading]               = useState(false);

    const [changeRoleDialog, setChangeRoleDialog] = useState({ open: false, user: null });
    const [selectedRole, setSelectedRole]         = useState("");
    const [roleLoading, setRoleLoading]           = useState(false);

    const [previewUser, setPreviewUser] = useState(null);

    const headerRef = useRef(null);
    const listRef   = useRef(null);

    useEffect(() => { fetchUsers(); }, []);

    // Header slide-in
    useEffect(() => {
        const ctx = gsap.context(() => {
            if (headerRef.current) {
                gsap.fromTo(headerRef.current,
                    { y: -28, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "y,transform" }
                );
            }
        });
        return () => ctx.revert();
    }, []);

    // Rows stagger after data loads
    useEffect(() => {
        if (!loading && listRef.current) {
            const rows = listRef.current.querySelectorAll(".user-row");
            if (rows.length > 0) {
                gsap.fromTo(rows,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power2.out", clearProps: "transform,opacity" }
                );
            }
        }
    }, [loading]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
        try {
            await deleteUser(userId);
            toast.success("User deleted successfully!");
            await fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.Message || error.message || "Failed to delete user");
        }
    };

    const handleSort = (field) => {
        if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortOrder("asc"); }
    };

    const openResetPassword = (user) => {
        setResetNewPassword("");
        setResetConfirmPassword("");
        setResetPasswordDialog({ open: true, user });
    };

    const handleResetPassword = async () => {
        if (resetNewPassword !== resetConfirmPassword) { toast.error("Passwords do not match."); return; }
        if (resetNewPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
        setResetLoading(true);
        try {
            await apiClient.put('/api/v1/admin/password', {
                userId: resetPasswordDialog.user.id,
                newPassword: resetNewPassword,
            });
            toast.success("Password reset successfully!");
            setResetPasswordDialog({ open: false, user: null });
        } catch (error) {
            toast.error(error.response?.data?.Message || error.response?.data?.message || error.message || "Failed to reset password");
        } finally {
            setResetLoading(false);
        }
    };

    const openChangeRole = (user) => {
        setSelectedRole(isUserAdmin(user) ? "ADMIN" : "USER");
        setChangeRoleDialog({ open: true, user });
    };

    const handleChangeRole = async () => {
        setRoleLoading(true);
        try {
            await apiClient.put('/api/v1/user/role', {
                userId: changeRoleDialog.user.id,
                role: selectedRole,
            });
            toast.success("Role updated successfully!");
            setChangeRoleDialog({ open: false, user: null });
            await fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.Message || error.response?.data?.message || error.message || "Failed to update role");
        } finally {
            setRoleLoading(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const adminCount   = users.filter(isUserAdmin).length;
    const regularCount = users.length - adminCount;

    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            (user.email?.toLowerCase()     || "").includes(s) ||
            (user.firstName?.toLowerCase() || "").includes(s) ||
            (user.lastName?.toLowerCase()  || "").includes(s) ||
            String(user.id || "").includes(s)
        );
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let aVal, bVal;
        switch (sortField) {
            case "name":
                aVal = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
                bVal = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
                break;
            case "email":
                aVal = (a.email || "").toLowerCase();
                bVal = (b.email || "").toLowerCase();
                break;
            case "role":
                aVal = getRoleLabel(a).toLowerCase();
                bVal = getRoleLabel(b).toLowerCase();
                break;
            default:
                aVal = a.id || 0;
                bVal = b.id || 0;
        }
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    const statItems = [
        { label: "Total",   value: users.length,   color: "text-violet-600 dark:text-violet-400" },
        { label: "Admins",  value: adminCount,      color: "text-blue-600 dark:text-blue-400"    },
        { label: "Regular", value: regularCount,    color: "text-emerald-600 dark:text-emerald-400" },
        ...(searchTerm ? [{ label: "Results", value: sortedUsers.length, color: "text-orange-600 dark:text-orange-400" }] : []),
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AppLayout>
            {/* ── Full-bleed Stats Bar ── */}
            <div ref={headerRef} className="-mx-4 -mt-4 mb-6 border-b border-border bg-card md:-mx-8 md:-mt-8">
                <div className="flex items-center gap-2 px-4 md:px-6 py-4">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3 md:flex-nowrap md:justify-start md:gap-6">
                        {statItems.map((s, i) => (
                            <div key={s.label} className="flex items-center gap-2 md:gap-5 shrink-0">
                                {i > 0 && <div className="hidden md:block w-px h-6 bg-border shrink-0" />}
                                <div>
                                    <p className={cn("text-[10px] uppercase tracking-wider font-medium", s.color)}>
                                        {s.label}
                                    </p>
                                    <p className="text-xl font-bold leading-none mt-0.5 tabular-nums">{s.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* ── Search + Sort ── */}
                <div className="flex min-w-0 items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or ID…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => handleSort("name")}
                            className={cn("gap-1 text-xs px-2", sortField === "name" && "text-primary")}
                        >
                            Name <ArrowUpDown className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => handleSort("role")}
                            className={cn("gap-1 text-xs px-2 hidden sm:flex", sortField === "role" && "text-primary")}
                        >
                            Role <ArrowUpDown className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => handleSort("id")}
                            className={cn("gap-1 text-xs px-2 hidden sm:flex", sortField === "id" && "text-primary")}
                        >
                            ID <ArrowUpDown className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* ── User list ── */}
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-[60px] rounded-xl bg-muted/40 animate-pulse" />
                        ))}
                    </div>
                ) : sortedUsers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-12 text-center space-y-3">
                        <UserCircle className="mx-auto h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                            {searchTerm ? "No users match your search" : "No users found"}
                        </p>
                    </div>
                ) : (
                    <div ref={listRef} className="space-y-2">
                        {sortedUsers.map(user => (
                            <div key={user.id} className="user-row">
                                <UserRow
                                    user={user}
                                    onResetPassword={openResetPassword}
                                    onChangeRole={openChangeRole}
                                    onDelete={(u) => handleDeleteUser(
                                        u.id,
                                        `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || `User #${u.id}`
                                    )}
                                    onPreview={setPreviewUser}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Reset Password Dialog ── */}
            <Dialog
                open={resetPasswordDialog.open}
                onOpenChange={(open) => setResetPasswordDialog(prev => ({ ...prev, open }))}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            Set a new password for{" "}
                            <strong>
                                {resetPasswordDialog.user
                                    ? `${resetPasswordDialog.user.firstName || ""} ${resetPasswordDialog.user.lastName || ""}`.trim() || resetPasswordDialog.user.email
                                    : ""}
                            </strong>
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="resetNewPassword">New Password</Label>
                            <Input
                                id="resetNewPassword"
                                type="password"
                                value={resetNewPassword}
                                onChange={(e) => setResetNewPassword(e.target.value)}
                                disabled={resetLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="resetConfirmPassword">Confirm Password</Label>
                            <Input
                                id="resetConfirmPassword"
                                type="password"
                                value={resetConfirmPassword}
                                onChange={(e) => setResetConfirmPassword(e.target.value)}
                                disabled={resetLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setResetPasswordDialog({ open: false, user: null })}
                            disabled={resetLoading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleResetPassword} disabled={resetLoading}>
                            {resetLoading ? "Resetting…" : "Reset Password"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── User Preview Dialog ── */}
            <Dialog
                open={!!previewUser}
                onOpenChange={(open) => { if (!open) setPreviewUser(null); }}
            >
                <DialogContent className="max-w-sm p-0 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/60" />
                    <div className="px-6 pt-5 pb-6">
                        <DialogHeader className="mb-5">
                            <DialogTitle className="flex items-center gap-2.5 text-base">
                                {previewUser && (() => {
                                    const a = isUserAdmin(previewUser);
                                    const initials = getInitials(previewUser.firstName, previewUser.lastName);
                                    return (
                                        <>
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback className={cn(
                                                    "text-sm font-semibold",
                                                    a ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                                                      : "bg-primary/10 text-primary"
                                                )}>
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">
                                                {`${previewUser.firstName || ""} ${previewUser.lastName || ""}`.trim() || "—"}
                                            </span>
                                        </>
                                    );
                                })()}
                            </DialogTitle>
                        </DialogHeader>
                        {previewUser && (
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium truncate max-w-[200px]">{previewUser.email || "—"}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground">Role</span>
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "text-xs",
                                            isUserAdmin(previewUser) && "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                                        )}
                                    >
                                        {getRoleLabel(previewUser)}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground">ID</span>
                                    <span className="font-mono text-xs">#{previewUser.id}</span>
                                </div>
                                {previewUser.disabled && (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge variant="outline" className="text-xs text-destructive border-destructive/40">
                                            Disabled
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Change Role Dialog ── */}
            <Dialog
                open={changeRoleDialog.open}
                onOpenChange={(open) => setChangeRoleDialog(prev => ({ ...prev, open }))}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Change Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            Change role for{" "}
                            <strong>
                                {changeRoleDialog.user
                                    ? `${changeRoleDialog.user.firstName || ""} ${changeRoleDialog.user.lastName || ""}`.trim() || changeRoleDialog.user.email
                                    : ""}
                            </strong>
                        </p>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setChangeRoleDialog({ open: false, user: null })}
                            disabled={roleLoading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleChangeRole} disabled={roleLoading}>
                            {roleLoading ? "Saving…" : "Save Role"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
