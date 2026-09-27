import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Info } from "lucide-react";
import { IconBoard, IconFolder, IconHome, IconIssues, IconLabel, IconUser, IconUsers } from "@/components/arcade/icons";
import { PixelMark } from "@/components/arcade/PixelMark";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";

const ALL_NAV_ITEMS = [
    { title: "Dashboard", url: "/dashboard", icon: IconHome },
    { title: "Projects", url: "/projects", icon: IconFolder },
    { title: "Issues", url: "/issues", icon: IconIssues },
    { title: "Board", url: "/board", icon: IconBoard },
    { title: "Teams", url: "/teams", icon: IconUsers },
    { title: "Users", url: "/users", icon: IconUser, adminOnly: true },
    { title: "Labels", url: "/labels", icon: IconLabel, adminOnly: true },
];

export const Sidebar = () => {
    const [open, setOpen] = useState(false);
    const systemVersion = useAuthStore((state) => state.systemVersion);
    const isAdmin = useAuthStore((state) => state.isAdmin);
    const isAdminUser = isAdmin();
    const navItems = ALL_NAV_ITEMS.filter(item => !item.adminOnly || isAdminUser);

    const versionLabel = systemVersion
        ? 'v' + systemVersion.replace(/^v/, '').split('.').slice(0, 3).join('.').substring(0, 9)
        : null;

    return (
        <aside
            data-slot="app-sidebar"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocusCapture={() => setOpen(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setOpen(false);
                }
            }}
            className={cn(
                "relative top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r-2 border-border bg-card transition-[width] duration-200 [transition-timing-function:steps(5,end)] md:flex",
                open ? "w-72" : "w-[4.75rem]"
            )}
        >
            <div className="flex h-16 items-center border-b-2 border-border px-4">
                <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                        <PixelMark size={30} />
                    </span>
                    <div
                        className={cn(
                            "min-w-0 transition-all duration-200",
                            open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
                        )}
                    >
                        <div className="logo-text-wrap">
                            <span className="font-pixel block truncate text-lg font-bold leading-tight text-foreground logo-text-main">
                                TaskSystem
                            </span>
                        </div>
                        {versionLabel && (
                            <div className="flex items-center gap-1">
                                <span className="hud text-[10px] leading-tight text-muted-foreground">
                                    {versionLabel}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 rounded-full text-muted-foreground hover:text-foreground"
                                            aria-label="Release notes"
                                        >
                                            <Info className="h-3 w-3" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-[360px]">
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold">What&apos;s new in this release</p>
                                            <ul className="space-y-1 text-xs text-muted-foreground">
                                                <li>Dashboard supports Default, Custom and Jira-like desktop modes.</li>
                                                <li>Custom widgets can be enabled, reordered and resized.</li>
                                                <li>Analytics widgets include status, priority, trend and progress charts.</li>
                                                <li>Projects and issues views keep the latest data refresh fixes.</li>
                                                <li>Labels and Users remain visible only for admin users.</li>
                                            </ul>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 p-3" data-tour="nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.url}
                        to={item.url}
                        title={!open ? item.title : undefined}
                        className={({ isActive }) =>
                            cn(
                                "sidebar-nav-item hud px-chamfer relative flex h-11 items-center gap-3 border-2 px-3 text-xs transition-[background-color,border-color,color] duration-100 [transition-timing-function:steps(2,end)]",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                                isActive
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                            )
                        }
                    >
                        <item.icon width={20} height={20} aria-hidden="true" className="shrink-0" />
                        <span
                            className={cn(
                                "whitespace-nowrap transition-opacity duration-150",
                                open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
                            )}
                        >
                            {item.title}
                        </span>
                    </NavLink>
                ))}
            </nav>

        </aside>
    );
};
