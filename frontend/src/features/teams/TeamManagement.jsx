import { useEffect, useState, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { useTeamStore } from "@/store/teamStore";
import { useUserStore } from "@/store/userStore";
import { AddButton } from "@/components/ui/AddButton";
import {
    Plus, Users, UserPlus, UserMinus, Search,
    ArrowLeft, ChevronRight, Sparkles, Inbox
} from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { shouldAnimateEntrance } from "@/lib/motion";

// ─── Color palette cycling per team ───────────────────────────────────────────
const PALETTE = [
    { dot: "bg-violet-500", soft: "bg-violet-500/10 dark:bg-violet-500/15", text: "text-violet-600 dark:text-violet-400", ring: "ring-violet-500/30" },
    { dot: "bg-blue-500",    soft: "bg-blue-500/10 dark:bg-blue-500/15",    text: "text-blue-600 dark:text-blue-400",    ring: "ring-blue-500/30"   },
    { dot: "bg-emerald-500", soft: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/30" },
    { dot: "bg-orange-500",  soft: "bg-orange-500/10 dark:bg-orange-500/15",  text: "text-orange-600 dark:text-orange-400",  ring: "ring-orange-500/30"  },
    { dot: "bg-rose-500",    soft: "bg-rose-500/10 dark:bg-rose-500/15",    text: "text-rose-600 dark:text-rose-400",    ring: "ring-rose-500/30"   },
    { dot: "bg-cyan-500",    soft: "bg-cyan-500/10 dark:bg-cyan-500/15",    text: "text-cyan-600 dark:text-cyan-400",    ring: "ring-cyan-500/30"   },
];
const getColor = (i) => PALETTE[i % PALETTE.length];

// ─── Overlapping avatar stack ──────────────────────────────────────────────────
function AvatarStack({ members = [], max = 4, colorIndex }) {
    const color = getColor(colorIndex);
    const shown = members.slice(0, max);
    const rest  = members.length - max;
    return (
        <div className="flex -space-x-2">
            {shown.map((m) => (
                <Avatar key={m.id} className={cn("h-7 w-7 border-2 border-background ring-1", color.ring)}>
                    <AvatarFallback className={cn("text-[10px] font-semibold", color.soft, color.text)}>
                        {getInitials(m.firstName, m.lastName)}
                    </AvatarFallback>
                </Avatar>
            ))}
            {rest > 0 && (
                <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground font-medium">+{rest}</span>
                </div>
            )}
        </div>
    );
}

// ─── Team list item ────────────────────────────────────────────────────────────
function TeamListItem({ team, index, isActive, onClick }) {
    const color = getColor(index);
    return (
        <button
            onClick={onClick}
            className={cn(
                "team-list-item w-full text-left rounded-xl px-3 py-3 flex items-center gap-3 transition-all duration-200 group",
                isActive
                    ? cn("shadow-sm ring-1", color.soft, color.ring)
                    : "hover:bg-muted/60"
            )}
        >
            <span className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125",
                color.dot
            )} />
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold truncate", isActive && color.text)}>
                    {team.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? "s" : ""}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <AvatarStack members={team.members || []} max={3} colorIndex={index} />
                <ChevronRight className={cn(
                    "h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200",
                    isActive && "translate-x-0.5 text-muted-foreground"
                )} />
            </div>
        </button>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TeamManagement() {
    const { teams, fetchTeams, createTeam, addUserToTeam, removeUserFromTeam, loading } = useTeamStore();
    const { users, fetchUsers } = useUserStore();

    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [search, setSearch]                 = useState("");
    const [mobileView, setMobileView]         = useState("list");

    const [createOpen,  setCreateOpen]  = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [creating,    setCreating]    = useState(false);

    const [addMemberId,   setAddMemberId]   = useState("");
    const [addingMember,  setAddingMember]  = useState(false);
    const [removingId,    setRemovingId]    = useState(null);

    // ── Animation refs ──────────────────────────────────────────────────────────
    const statsBarRef      = useRef(null);
    const leftPanelRef     = useRef(null);
    const rightPanelRef    = useRef(null);
    const detailHeaderRef  = useRef(null);
    const detailBodyRef    = useRef(null);
    const mobilePanelRef   = useRef(null);
    const prevTeamIdRef    = useRef(null);
    const prevMemberCount  = useRef(0);

    // ── Derived data (must be before useEffects that reference them) ────────────
    const filteredTeams = useMemo(() =>
        teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
        [teams, search]
    );
    const selectedTeam      = teams.find(t => t.id === selectedTeamId);
    const selectedTeamIndex = teams.findIndex(t => t.id === selectedTeamId);
    const selectedColor     = getColor(selectedTeamIndex >= 0 ? selectedTeamIndex : 0);
    const availableUsers    = useMemo(() =>
        users.filter(u => !selectedTeam?.members?.some(m => m.id === u.id)),
        [users, selectedTeam]
    );
    const totalMembers = useMemo(() =>
        teams.reduce((sum, t) => sum + (t.members?.length || 0), 0), [teams]
    );

    // ── Data fetching ───────────────────────────────────────────────────────────
    useEffect(() => { fetchTeams(); fetchUsers(); }, []);

    useEffect(() => {
        if (teams.length > 0 && !selectedTeamId) setSelectedTeamId(teams[0].id);
    }, [teams]);

    // ── Page mount animation ────────────────────────────────────────────────────
    // Every step clears its props on finish: a panel that starts at opacity 0 must
    // never be able to stay there if the timeline is cut short.
    useEffect(() => {
        if (!shouldAnimateEntrance()) return undefined;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out", clearProps: "transform,opacity" } });
            tl.fromTo(statsBarRef.current,
                { y: -40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.55 }
            )
            .fromTo(leftPanelRef.current,
                { x: -40, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5 }, "-=0.3"
            )
            .fromTo(rightPanelRef.current,
                { x: 40, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5 }, "-=0.4"
            );
        });
        return () => ctx.revert();
    }, []);

    // ── Stagger team list items when list loads ─────────────────────────────────
    useEffect(() => {
        if (!leftPanelRef.current || teams.length === 0 || !shouldAnimateEntrance()) return;
        const items = leftPanelRef.current.querySelectorAll(".team-list-item");
        gsap.fromTo(items,
            { x: -20, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.3, stagger: 0.07, ease: "power2.out", clearProps: "transform,opacity" }
        );
    }, [teams.length]);

    // ── Animate detail panel when team changes ──────────────────────────────────
    useEffect(() => {
        if (!selectedTeamId || prevTeamIdRef.current === selectedTeamId) return;
        prevTeamIdRef.current = selectedTeamId;
        if (!shouldAnimateEntrance()) return;
        prevMemberCount.current = 0; // reset so member animation fires fresh

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if (detailHeaderRef.current) {
            tl.fromTo(detailHeaderRef.current,
                { y: -16, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.35, clearProps: "transform,opacity" }
            );
        }
        if (detailBodyRef.current) {
            tl.fromTo(detailBodyRef.current,
                { x: 30, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, clearProps: "transform,opacity" }, "-=0.2"
            );
        }
    }, [selectedTeamId]);

    // ── Stagger member items when team detail renders / members change ───────────
    useEffect(() => {
        if (!detailBodyRef.current || !selectedTeamId) return;
        const count = selectedTeam?.members?.length ?? 0;
        if (!shouldAnimateEntrance()) { prevMemberCount.current = count; return; }

        // Animate entire list in on team switch (prevMemberCount is 0 after reset)
        if (prevMemberCount.current === 0 && count > 0) {
            const items = detailBodyRef.current.querySelectorAll(".member-item");
            gsap.fromTo(items,
                { y: 18, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.28, stagger: 0.06, ease: "power2.out", delay: 0.15, clearProps: "transform,opacity" }
            );
        }
        // Animate only the newest member card when one is added
        else if (count > prevMemberCount.current) {
            const items = detailBodyRef.current.querySelectorAll(".member-item");
            const newest = items[items.length - 1];
            if (newest) {
                gsap.fromTo(newest,
                    { scale: 0.9, x: 20, opacity: 0 },
                    { scale: 1, x: 0, opacity: 1, duration: 0.35, ease: "back.out(1.6)", clearProps: "transform,opacity" }
                );
            }
        }

        prevMemberCount.current = count;
    }, [selectedTeam?.members?.length, selectedTeamId]);

    // ── Animate mobile panel switch ─────────────────────────────────────────────
    useEffect(() => {
        if (!mobilePanelRef.current || !shouldAnimateEntrance()) return;
        gsap.fromTo(mobilePanelRef.current,
            { x: mobileView === "detail" ? 40 : -40, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.35, ease: "power3.out", clearProps: "transform,opacity" }
        );
    }, [mobileView]);

    // ── Handlers ────────────────────────────────────────────────────────────────
    const handleSelectTeam = (id) => {
        setSelectedTeamId(id);
        setAddMemberId("");
        setMobileView("detail");
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;
        setCreating(true);
        try {
            await createTeam({ name: newTeamName.trim() });
            toast.success(`Team "${newTeamName.trim()}" created!`);
            setNewTeamName("");
            setCreateOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.Message || err.message || "Failed to create team");
        } finally { setCreating(false); }
    };

    const handleAddMember = async () => {
        if (!addMemberId || !selectedTeamId) return;
        setAddingMember(true);
        try {
            await addUserToTeam(selectedTeamId, Number(addMemberId));
            const user = users.find(u => u.id === Number(addMemberId));
            toast.success(`${user?.firstName} ${user?.lastName} added!`);
            setAddMemberId("");
        } catch (err) {
            toast.error(err.response?.data?.Message || err.message || "Failed to add member");
        } finally { setAddingMember(false); }
    };

    const handleRemoveMember = async (member) => {
        if (!window.confirm(`Remove ${member.firstName} ${member.lastName} from ${selectedTeam?.name}?`)) return;

        // Animate the member row out before removing
        const el = document.getElementById(`member-${member.id}`);
        if (el) {
            await gsap.to(el, { x: 30, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0, duration: 0.3, ease: "power2.in" });
        }

        setRemovingId(member.id);
        try {
            await removeUserFromTeam(selectedTeamId, member.id);
            toast.success(`${member.firstName} ${member.lastName} removed`);
        } catch (err) {
            toast.error(err.response?.data?.Message || err.message || "Failed to remove member");
            // Restore element if API failed
            if (el) gsap.to(el, { x: 0, opacity: 1, height: "auto", duration: 0.3 });
        } finally { setRemovingId(null); }
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <AppLayout>
            <div className="app-bleed flex min-w-0 flex-col overflow-hidden">

                {/* ── Stats Bar ── */}
                <div
                    ref={statsBarRef}
                    className="shrink-0 flex min-w-0 items-center justify-between gap-4 px-4 md:px-8 py-4 border-b border-border bg-card"
                >
                    <div className="flex min-w-0 items-center gap-4 md:gap-6">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Teams</p>
                            <p className="text-2xl font-bold leading-none mt-0.5">{teams.length}</p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Members</p>
                            <p className="text-2xl font-bold leading-none mt-0.5">{totalMembers}</p>
                        </div>
                        {loading && <p className="text-xs text-muted-foreground animate-pulse ml-2">Syncing…</p>}
                    </div>

                    <div className="hidden sm:block shrink-0">
                        <AddButton label="New Team" onClick={() => setCreateOpen(true)} />
                    </div>
                    <Button onClick={() => setCreateOpen(true)} size="sm" className="sm:hidden gap-2 shrink-0">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* ── Split area ── */}
                <div className="flex min-w-0 flex-1 overflow-hidden">

                    {/* ── LEFT: list ── */}
                    <div
                        ref={leftPanelRef}
                        className={cn(
                            "flex flex-col border-r border-border bg-muted/20 overflow-hidden",
                            "w-full md:w-72 lg:w-80 shrink-0",
                            mobileView === "detail" ? "hidden md:flex" : "flex"
                        )}
                    >
                        {/* Search */}
                        <div className="shrink-0 px-3 py-3 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search teams…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 h-9 bg-background border-border"
                                />
                            </div>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                            {loading && teams.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
                                </div>
                            ) : filteredTeams.length === 0 ? (
                                <div className="py-12 text-center space-y-2">
                                    <Inbox className="h-8 w-8 mx-auto text-muted-foreground/40" />
                                    <p className="text-sm text-muted-foreground">
                                        {search ? "No teams match" : "No teams yet"}
                                    </p>
                                </div>
                            ) : filteredTeams.map((team) => (
                                <TeamListItem
                                    key={team.id}
                                    team={team}
                                    index={teams.indexOf(team)}
                                    isActive={team.id === selectedTeamId}
                                    onClick={() => handleSelectTeam(team.id)}
                                />
                            ))}
                        </div>

                        <div className="shrink-0 px-4 py-3 border-t border-border">
                            <p className="text-xs text-muted-foreground/60 text-center">
                                {filteredTeams.length} of {teams.length} team{teams.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    {/* ── RIGHT: detail ── */}
                    <div
                        ref={rightPanelRef}
                        className={cn(
                            "min-w-0 flex-1 flex flex-col overflow-hidden",
                            mobileView === "list" ? "hidden md:flex" : "flex"
                        )}
                    >
                        {/* Mobile panel animation wrapper */}
                        <div ref={mobileView !== "list" ? mobilePanelRef : null} className="flex flex-col flex-1 overflow-hidden">

                            {!selectedTeam ? (
                                /* Empty state */
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                                        <Users className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">Select a team</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Choose a team from the list to manage its members
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />Create first team
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Detail header */}
                                    <div
                                        ref={detailHeaderRef}
                                        className={cn("shrink-0 px-5 md:px-8 py-5 border-b border-border", selectedColor.soft)}
                                    >
                                        {/* Mobile back */}
                                        <button
                                            onClick={() => setMobileView("list")}
                                            className="md:hidden flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors"
                                        >
                                            <ArrowLeft className="h-4 w-4" /> All teams
                                        </button>

                                        <div className="flex items-center gap-4">
                                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", selectedColor.dot)}>
                                                <Users className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h1 className="text-xl md:text-2xl font-bold">{selectedTeam.name}</h1>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {selectedTeam.members?.length || 0} member{(selectedTeam.members?.length || 0) !== 1 ? "s" : ""}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">ID: {selectedTeam.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scrollable body */}
                                    <div ref={detailBodyRef} className="flex-1 overflow-y-auto">
                                        <div className="max-w-2xl space-y-6 px-4 py-6 md:px-8">

                                            {/* Members */}
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                        Members
                                                    </h2>
                                                    <span className="text-xs text-muted-foreground">
                                                        {selectedTeam.members?.length || 0}
                                                    </span>
                                                </div>

                                                {!selectedTeam.members || selectedTeam.members.length === 0 ? (
                                                    <div className="rounded-xl border border-dashed border-border py-10 text-center space-y-2">
                                                        <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30" />
                                                        <p className="text-sm text-muted-foreground">
                                                            No members yet — add someone below
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {selectedTeam.members.map((member) => (
                                                            <div
                                                                id={`member-${member.id}`}
                                                                key={member.id}
                                                                className="member-item group flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-border/80 hover:shadow-sm transition-all duration-150 overflow-hidden"
                                                            >
                                                                <Avatar className={cn("h-10 w-10 shrink-0 ring-2", selectedColor.ring)}>
                                                                    <AvatarFallback className={cn("text-sm font-semibold", selectedColor.soft, selectedColor.text)}>
                                                                        {getInitials(member.firstName, member.lastName)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold truncate">
                                                                        {member.firstName} {member.lastName}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveMember(member)}
                                                                    disabled={removingId === member.id}
                                                                    className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <UserMinus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Inline add member */}
                                            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                                                    <Label className="text-sm font-semibold">Add member</Label>
                                                </div>
                                                {availableUsers.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        All users are already in this team.
                                                    </p>
                                                ) : (
                                                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                                                        <Select value={addMemberId} onValueChange={setAddMemberId}>
                                                            <SelectTrigger className="flex-1 bg-background">
                                                                <SelectValue placeholder="Select a person…" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableUsers.map(u => (
                                                                    <SelectItem key={u.id} value={String(u.id)}>
                                                                        <span className="font-medium">{u.firstName} {u.lastName}</span>
                                                                        <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            onClick={handleAddMember}
                                                            disabled={!addMemberId || addingMember}
                                                        >
                                                            {addingMember ? "Adding…" : "Add"}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Create Team Dialog ── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Create new team</DialogTitle>
                        <DialogDescription>Give your team a name to get started.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTeam} className="space-y-4 pt-1">
                        <div className="space-y-2">
                            <Label htmlFor="teamName">Team name</Label>
                            <Input
                                id="teamName"
                                placeholder="e.g. Design, Backend, Marketing…"
                                value={newTeamName}
                                onChange={e => setNewTeamName(e.target.value)}
                                disabled={creating}
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={creating || !newTeamName.trim()}>
                                <Plus className="h-4 w-4 mr-2" />
                                {creating ? "Creating…" : "Create"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
