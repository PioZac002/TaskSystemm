import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/arcade/icons";
import { cn } from "@/lib/utils";

// Cabinet power switch: the printed card (light) or the phosphor screen (dark)
export const ThemeToggle = ({ className }) => {
    const [theme, setTheme] = useState(() => {
        if (typeof window === "undefined") return "dark";
        try {
            return localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        } catch {
            return "dark";
        }
    });

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        try {
            localStorage.setItem("theme", next);
        } catch {
            // Storage unavailable: the choice still applies for this session
        }
    };

    const isDark = theme === "dark";

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Dark screen"
            title={isDark ? "Switch to the printed card (light)" : "Switch to the screen (dark)"}
            onClick={toggleTheme}
            className={cn(
                "hud px-chamfer relative grid h-9 w-[4.5rem] shrink-0 grid-cols-2 border-2 border-border bg-muted p-0.5 text-muted-foreground",
                className
            )}
        >
            <span
                aria-hidden="true"
                className="px-chamfer absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] bg-primary transition-transform duration-150 [transition-timing-function:steps(3,end)]"
                style={{ transform: isDark ? "translateX(100%)" : "translateX(0)" }}
            />
            <span className={cn("relative z-10 grid place-items-center", !isDark && "text-primary-foreground")}>
                <IconSun width={16} height={16} aria-hidden="true" />
            </span>
            <span className={cn("relative z-10 grid place-items-center", isDark && "text-primary-foreground")}>
                <IconMoon width={16} height={16} aria-hidden="true" />
            </span>
        </button>
    );
};
