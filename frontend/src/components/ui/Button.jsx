import React, { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Cabinet buttons: chamfered tiles, pixel caps, a 1px pressed drop on :active.
// The fill steps rather than fades; focus rings appear instantly.
const buttonVariants = cva(
    "hud px-chamfer inline-flex select-none items-center justify-center gap-2 whitespace-nowrap border-2 text-xs ring-offset-background transition-[background-color,border-color,color] duration-100 [transition-timing-function:steps(2,end)] active:translate-y-px motion-reduce:active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "border-primary bg-primary text-primary-foreground hover:border-foreground",
                destructive: "border-destructive bg-destructive text-destructive-foreground hover:border-foreground",
                outline: "border-input bg-card text-foreground hover:border-primary",
                secondary: "border-transparent bg-secondary text-secondary-foreground hover:border-input",
                ghost: "border-transparent text-foreground hover:border-input hover:bg-muted",
                link: "border-transparent text-primary underline-offset-4 hover:underline active:translate-y-0",
                // Kept for existing call sites; renders as the primary fill
                gradient: "border-primary bg-primary text-primary-foreground hover:border-foreground",
                success: "border-success bg-success text-success-foreground hover:border-foreground",
            },
            size: {
                default: "h-10 px-4",
                sm: "h-9 px-3",
                lg: "h-12 px-6 text-sm",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
