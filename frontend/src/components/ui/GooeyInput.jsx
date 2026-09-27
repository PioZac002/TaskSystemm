import React, { forwardRef } from "react";
import { IconSearch } from "@/components/arcade/icons";
import { cn } from "@/lib/utils";

// Name kept for existing call sites; renders the cabinet's name-entry field.
const GooeyInput = forwardRef(
    ({ className, containerClassName, icon = true, type = "search", ...props }, ref) => (
        <div
            className={cn(
                "px-chamfer relative flex h-10 w-full items-center border-2 border-input bg-card focus-within:border-ring",
                containerClassName
            )}
        >
            {icon && (
                <IconSearch width={16} height={16} aria-hidden="true" className="pointer-events-none absolute left-3 text-muted-foreground" />
            )}
            <input
                ref={ref}
                type={type}
                className={cn(
                    "h-full w-full bg-transparent pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                    icon ? "pl-9" : "pl-3",
                    className
                )}
                {...props}
            />
        </div>
    )
);
GooeyInput.displayName = "GooeyInput";

export { GooeyInput };
