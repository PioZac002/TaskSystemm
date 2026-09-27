import React, { forwardRef } from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = forwardRef(({ className, indicatorClassName, value, ...props }, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
        value={value}
        {...props}
    >
        {/* Only value changes animate; the bar never "draws in" on mount */}
        <ProgressPrimitive.Indicator
            className={cn("h-full w-full flex-1 rounded-full bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none", indicatorClassName)}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </ProgressPrimitive.Root>
));
Progress.displayName = "Progress";

export { Progress };
