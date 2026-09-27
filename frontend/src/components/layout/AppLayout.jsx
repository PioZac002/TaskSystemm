import React, { useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { DesktopNotificationDock, NotificationRealtimeBridge } from "@/components/notifications/NotificationCenter";

export const AppLayout = ({ children }) => {
    const shellRef = useRef(null);
    const mainRef = useRef(null);

    // Marks the shell once content scrolls under the top bar (drives the Fluid scroll-edge effect).
    // Writes a data attribute directly so scrolling never re-renders the page.
    useEffect(() => {
        const main = mainRef.current;
        const shell = shellRef.current;
        if (!main || !shell) return;
        const update = () => {
            const scrolled = main.scrollTop > 4 ? "true" : "false";
            if (shell.dataset.scrolled !== scrolled) shell.dataset.scrolled = scrolled;
        };
        update();
        main.addEventListener("scroll", update, { passive: true });
        return () => main.removeEventListener("scroll", update);
    }, []);

    return (
        // h-dvh, not h-screen: on phones the browser toolbar eats into 100vh,
        // which would push the bottom of every full-height page out of sight.
        <div ref={shellRef} className="app-shell relative flex h-dvh w-full max-w-full overflow-hidden bg-background">

            <NotificationRealtimeBridge />
            <Sidebar />
            <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
                <TopBar />
                <main ref={mainRef} className="app-main min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
                    {children}
                </main>
            </div>
            <DesktopNotificationDock />
        </div>
    );
};
