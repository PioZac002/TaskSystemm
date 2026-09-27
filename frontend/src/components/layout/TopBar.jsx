import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { IconBoard, IconFolder, IconHome, IconIssues, IconLabel, IconLogout, IconMenu, IconClose, IconSearch, IconSettings, IconUser, IconUsers } from "@/components/arcade/icons";
import { useAuthStore } from "@/store/authStore";
import { useSearchStore } from "@/store/searchStore";
import { useProjectStore } from "@/store/projectStore";
import { useIssueStore } from "@/store/issueStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GooeyInput } from "@/components/ui/GooeyInput";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SearchResults } from "./SearchResults";
import { IssueDetailsModal } from "@/components/modals/IssueDetailsModal";
import { ProjectDetailsModal } from "@/components/modals/ProjectDetailsModal";
import { NotificationBell } from "@/components/notifications/NotificationCenter";

const ALL_NAV_ITEMS = [
    { title: "Dashboard", url: "/dashboard", icon: IconHome },
    { title: "Projects", url: "/projects", icon: IconFolder },
    { title: "Issues", url: "/issues", icon: IconIssues },
    { title: "Board", url: "/board", icon: IconBoard },
    { title: "Teams", url: "/teams", icon: IconUsers },
    { title: "Users", url: "/users", icon: IconUser, adminOnly: true },
    { title: "Labels", url: "/labels", icon: IconLabel, adminOnly: true },
];

export const TopBar = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const isAdmin = useAuthStore((state) => state.isAdmin);
    const navItems = ALL_NAV_ITEMS.filter(item => !item.adminOnly || isAdmin());

    // Search state
    const { searchTerm, isSearchOpen, setSearchTerm, setSearchOpen, clearSearch } = useSearchStore();
    const { fetchProjects } = useProjectStore();
    const { fetchIssues } = useIssueStore();

    // Fetch data for search on mount
    useEffect(() => {
        fetchProjects();
        fetchIssues();
    }, [fetchProjects, fetchIssues]);

    // Pobierz user i loading z authStore
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleIssueSelect = (issueId) => {
        if (isMobile) {
            setSelectedIssueId(issueId);
        } else {
            navigate(`/issues/${issueId}`);
        }
    };

    const handleProjectSelect = (projectId) => {
        if (isMobile) {
            setSelectedProjectId(projectId);
        } else {
            navigate(`/projects/${projectId}`);
        }
    };

    // Oblicz display name i inicjały z firstName/lastName
    const getDisplayName = () => {
        if (loading) return "Loading...";
        if (!user) return "Guest";

        // Backend zwraca: { firstName, lastName, email }
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return fullName || user.email || "User";
    };

    const getInitials = () => {
        if (loading || !user) return "?";

        const firstInitial = user.firstName?.[0] || '';
        const lastInitial = user.lastName?.[0] || '';

        if (firstInitial && lastInitial) {
            return `${firstInitial}${lastInitial}`.toUpperCase();
        }

        // Fallback: pierwsze 2 litery email
        return user.email?.substring(0, 2).toUpperCase() || "??";
    };

    const getEmail = () => {
        if (loading) return "Loading...";
        return user?.email || "No email";
    };

    return (
        <>
            <header data-slot="app-topbar" className="sticky top-0 z-50 flex h-16 min-w-0 items-center justify-between gap-3 border-b-2 border-border bg-background px-3 md:px-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <IconClose width={20} height={20} aria-hidden="true" /> : <IconMenu width={20} height={20} aria-hidden="true" />}
                </Button>

                {/* Search */}
                <div className="relative flex min-w-0 flex-1 items-center gap-2 md:max-w-xl md:gap-4">
                    {/* Mobile - Icon that opens overlay */}
                    <div className="shrink-0 md:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSearchOpen(!isSearchOpen)}
                            aria-label="Search"
                        >
                            <IconSearch width={20} height={20} aria-hidden="true" />
                        </Button>
                    </div>

                    {/* Desktop - Full search */}
                    <div className="relative hidden w-full md:block" data-tour="search">
                        <GooeyInput
                            type="search"
                            placeholder="Search projects, issues..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setSearchOpen(true);
                            }}
                            onFocus={() => setSearchOpen(true)}
                        />
                        <SearchResults
                            onIssueSelect={handleIssueSelect}
                            onProjectSelect={handleProjectSelect}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                    {/* Theme Toggle */}
                    <span data-tour="theme">
                        <ThemeToggle />
                    </span>

                    {/* Notifications */}
                    <NotificationBell />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-10 w-10 shrink-0 p-0"
                                disabled={loading}
                            >
                                <Avatar className="h-9 w-9 rounded-none">
                                    <AvatarImage src={user?.avatarUrl || ""} alt={getDisplayName()} />
                                    <AvatarFallback className="hud rounded-none bg-primary text-xs text-primary-foreground">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-popover" align="end">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {getDisplayName()}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {getEmail()}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => navigate("/profile")}
                                disabled={loading}
                            >
                                <IconSettings width={16} height={16} aria-hidden="true" className="mr-2" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleLogout}
                                disabled={loading}
                            >
                                <IconLogout width={16} height={16} aria-hidden="true" className="mr-2" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Mobile Navigation Menu - Dropdown from top */}
            <nav
                className={cn(
                    "fixed left-0 right-0 top-16 z-40 max-w-full overflow-x-hidden border-b-2 border-border bg-background transition-[opacity,transform] duration-150 [transition-timing-function:steps(3,end)] md:hidden",
                    mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
                )}
                aria-hidden={!mobileMenuOpen}
            >
                <div className="flex flex-col p-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.url}
                            to={item.url}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                cn(
                                    "hud px-chamfer flex items-center gap-3 border-2 px-4 py-3 text-xs",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                                    isActive ? "border-primary bg-primary text-primary-foreground" : "border-transparent text-muted-foreground hover:border-border"
                                )
                            }
                        >
                            <item.icon width={20} height={20} aria-hidden="true" />
                            <span>{item.title}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Mobile Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 overflow-x-hidden bg-background/90 md:hidden">
                    <div className="fixed left-0 right-0 top-16 border-b-2 bg-background p-4">
                        <div className="relative min-w-0">
                            <GooeyInput
                                type="search"
                                placeholder="Search projects, issues..."
                                className="pr-12"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                onClick={clearSearch}
                            >
                                <IconClose width={16} height={16} aria-hidden="true" />
                            </Button>
                        </div>
                        <div className="mt-2 relative">
                            <SearchResults
                                onIssueSelect={handleIssueSelect}
                                onProjectSelect={handleProjectSelect}
                            />
                        </div>
                    </div>
                    <div
                        className="absolute inset-0 -z-10"
                        onClick={clearSearch}
                    />
                </div>
            )}

            {/* Modals for search results - rendered outside search overlay so they survive clearSearch() */}
            <IssueDetailsModal
                open={!!selectedIssueId}
                onOpenChange={(open) => { if (!open) setSelectedIssueId(null); }}
                issueId={selectedIssueId}
            />
            <ProjectDetailsModal
                open={!!selectedProjectId}
                onOpenChange={(open) => { if (!open) setSelectedProjectId(null); }}
                projectId={selectedProjectId}
            />
        </>
    );
};
