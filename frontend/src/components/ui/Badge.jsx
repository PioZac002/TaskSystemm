import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Badges are HUD readouts: square tiles, pixel caps, no hover states.
const badgeVariants = cva(
    "hud inline-flex items-center gap-1 whitespace-nowrap border px-1.5 text-[0.6875rem] leading-5",
    {
        variants: {
            variant: {
                default: "border-primary bg-primary text-primary-foreground",
                secondary: "border-border bg-muted text-foreground",
                destructive: "border-[color-mix(in_srgb,var(--px-red)_55%,transparent)] bg-[color-mix(in_srgb,var(--px-red)_12%,transparent)] text-[var(--px-red)]",
                outline: "border-border text-muted-foreground",
                success: "border-[color-mix(in_srgb,var(--px-green)_55%,transparent)] bg-[color-mix(in_srgb,var(--px-green)_12%,transparent)] text-[var(--px-green)]",
                warning: "border-[color-mix(in_srgb,var(--px-gold)_55%,transparent)] bg-[color-mix(in_srgb,var(--px-gold)_12%,transparent)] text-[var(--px-gold)]",
                accent: "border-transparent bg-accent text-accent-foreground",
                todo: "st-chip st-TODO",
                inprogress: "st-chip st-IN_PROGRESS",
                done: "st-chip st-DONE",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

function Badge({ className, variant, ...props }) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
