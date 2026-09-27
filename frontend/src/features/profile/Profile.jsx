import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import { User, Mail, Save, Eye, EyeOff, Hash, ShieldCheck } from "lucide-react";

// ─── Password strength ────────────────────────────────────────────────────────
function getPasswordStrength(password) {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score, label: "Weak", color: "#f87171" };
    if (score <= 2) return { score, label: "Fair", color: "#fbbf24" };
    if (score <= 3) return { score, label: "Good", color: "#60a5fa" };
    return { score, label: "Strong", color: "#4ade80" };
}

// ─── Staggered fade-in helper ─────────────────────────────────────────────────
const fadeIn = (delayMs) => ({
    style: {
        animation: `fade-in 0.4s ease-out both`,
        animationDelay: `${delayMs}ms`,
    },
});

export default function Profile() {
    const user = useAuthStore((state) => state.user);
    const updateCachedUser = useAuthStore((state) => state.updateCachedUser);
    const { updateUser, loading } = useUserStore();

    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [email, setEmail] = useState(user?.email || "");
    const [userSlackId, setSlackUserId] = useState(user?.userSlackId ?? user?.slackUserId ?? "");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changePasswordLoading, setChangePasswordLoading] = useState(false);
    const [changePasswordError, setChangePasswordError] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setEmail(user.email || "");
            setSlackUserId(user.userSlackId ?? user.slackUserId ?? "");
        }
    }, [user]);

    const getDisplayName = () => {
        const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
        return fullName || user?.email || "User";
    };

    const getInitials = () => {
        const f = user?.firstName?.[0] || "";
        const l = user?.lastName?.[0] || "";
        if (f && l) return `${f}${l}`.toUpperCase();
        return user?.email?.substring(0, 2).toUpperCase() || "??";
    };

    const passwordStrength = getPasswordStrength(newPassword);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!user?.id) { toast.error("User not found. Please log in again."); return; }
        try {
            const normalizedSlackId = userSlackId.trim() || null;
            const updated = await updateUser(user.id, {
                firstName, lastName, email,
                userSlackId: normalizedSlackId,
                slackUserId: normalizedSlackId,
                disabled: user.disabled ?? false,
            });
            updateCachedUser(updated);
            setSlackUserId(updated.userSlackId ?? updated.slackUserId ?? "");
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.Message || error.message || "Failed to update profile");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setChangePasswordError("");
        if (newPassword !== confirmPassword) { setChangePasswordError("New passwords do not match."); return; }
        if (newPassword.length < 6) { setChangePasswordError("New password must be at least 6 characters."); return; }
        setChangePasswordLoading(true);
        try {
            await apiClient.put("/api/v1/user/me/password", { currentPassword, newPassword });
            toast.success("Password changed successfully!");
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        } catch (error) {
            setChangePasswordError(
                error.response?.data?.Message || error.response?.data?.message || error.message || "Failed to change password"
            );
        } finally {
            setChangePasswordLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">

                {/* ── Hero Banner ──────────────────────────────────────────── */}
                <div
                    {...fadeIn(0)}
                    className="relative rounded-xl overflow-hidden mb-4"
                    style={{
                        ...fadeIn(0).style,
                        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%)",
                    }}
                >
                    {/* Decorative circles */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
                        <div className="absolute top-1/2 right-1/3 w-20 h-20 rounded-full bg-white/5" />
                    </div>

                    <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-5">
                        {/* Avatar with glow */}
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 rounded-full scale-110 blur-md bg-white/30" />
                            <Avatar className="relative h-20 w-20 sm:h-24 sm:w-24 border-4 border-white/40 shadow-2xl transition-transform duration-300 hover:scale-105">
                                <AvatarFallback
                                    className="text-2xl sm:text-3xl font-bold bg-white/20 text-white"
                                >
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Name + badges */}
                        <div className="flex-1 text-center sm:text-left pb-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                {getDisplayName()}
                            </h1>
                            <p className="text-white/70 text-sm mt-0.5">{user?.email || ""}</p>
                            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                                    Active Member
                                </span>
                                {(user?.userSlackId ?? user?.slackUserId) && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white">
                                        <Hash className="h-3 w-3" />
                                        Slack connected
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats bar ────────────────────────────────────────────── */}
                <div
                    {...fadeIn(120)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5"
                >
                    {[
                        { label: "First Name", value: user?.firstName || "—", icon: User,  color: "#7c3aed" },
                        { label: "Last Name",  value: user?.lastName  || "—", icon: User,  color: "#4f46e5" },
                        { label: "Slack ID",   value: (user?.userSlackId ?? user?.slackUserId) || "Not set", icon: Hash, color: "#10b981" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div
                            key={label}
                            className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3 transition-all duration-150 hover:shadow-sm"
                            style={{ borderLeftWidth: "3px", borderLeftColor: color }}
                        >
                            <div
                                className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
                                style={{ backgroundColor: color + "18", color }}
                            >
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                                <p className="text-sm font-semibold truncate">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Personal Information ─────────────────────────────────── */}
                <div {...fadeIn(220)} className="mb-4">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-[3px] h-4 rounded-full shrink-0 bg-violet-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Personal Information
                        </h2>
                    </div>
                    <div className="rounded-xl bg-card border border-border p-5 sm:p-6 hover:shadow-sm transition-shadow duration-150">
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                        First Name
                                    </Label>
                                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={loading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                        Last Name
                                    </Label>
                                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={loading} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5" /> Email
                                </Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="userSlackId" className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5" /> Slack User ID
                                </Label>
                                <Input id="userSlackId" value={userSlackId} onChange={(e) => setSlackUserId(e.target.value)} placeholder="e.g. U01AB2C3D" disabled={loading} />
                            </div>
                            <Button type="submit" disabled={loading}>
                                <Save className="mr-2 h-4 w-4" />
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* ── Security / Change Password ───────────────────────────── */}
                <div {...fadeIn(320)} className="mb-6">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-[3px] h-4 rounded-full shrink-0 bg-blue-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Security
                        </h2>
                    </div>
                    <div className="rounded-xl bg-card border border-border p-5 sm:p-6 hover:shadow-sm transition-shadow duration-150">
                        <form onSubmit={handleChangePassword} className="space-y-4">

                            <div className="space-y-2">
                                <Label htmlFor="currentPassword" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                    Current Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrent ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        disabled={changePasswordLoading}
                                        required className="pr-10"
                                    />
                                    <button type="button" tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                    >
                                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={changePasswordLoading}
                                        required className="pr-10"
                                    />
                                    <button type="button" tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowNew(!showNew)}
                                    >
                                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {newPassword && (
                                    <div className="space-y-1 pt-0.5">
                                        <div className="flex gap-1 h-1.5">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} className="flex-1 rounded-full transition-all duration-300"
                                                    style={{ backgroundColor: i <= passwordStrength.score ? passwordStrength.color : "var(--color-border)" }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                                            {passwordStrength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                    Confirm New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={changePasswordLoading}
                                        required className="pr-10"
                                    />
                                    <button type="button" tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {confirmPassword && (
                                    <p className="text-xs font-medium"
                                        style={{ color: newPassword === confirmPassword ? "#4ade80" : "#f87171" }}
                                    >
                                        {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                                    </p>
                                )}
                            </div>

                            {changePasswordError && (
                                <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">
                                    {changePasswordError}
                                </p>
                            )}

                            <Button type="submit" variant="outline" disabled={changePasswordLoading}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                {changePasswordLoading ? "Changing..." : "Change Password"}
                            </Button>
                        </form>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
