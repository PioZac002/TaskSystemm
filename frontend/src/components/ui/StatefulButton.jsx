import React, { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function StatefulButton({
    children,
    className,
    disabled,
    onClick,
    loadingText = "Working...",
    successText = "Done",
    type = "button",
    ...props
}) {
    const [state, setState] = useState("idle");
    const resetTimer = useRef(null);

    useEffect(() => {
        return () => {
            if (resetTimer.current) {
                window.clearTimeout(resetTimer.current);
            }
        };
    }, []);

    const handleClick = async (event) => {
        if (disabled || state === "loading") return;

        setState("loading");
        try {
            const result = await onClick?.(event);

            if (result === false) {
                setState("idle");
                return;
            }

            setState("success");
            resetTimer.current = window.setTimeout(() => setState("idle"), 1300);
        } catch (error) {
            setState("idle");
            throw error;
        }
    };

    const isBusy = state === "loading";
    const isSuccess = state === "success";

    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={disabled || isBusy}
            aria-live="polite"
            data-slot="button"
            className={cn(buttonVariants(), "min-w-24", isSuccess && "bg-success hover:bg-success", className)}
            {...props}
        >
            {/* Keyed so each state label fades in instead of swapping text in place */}
            <span key={state} className="stateful-label inline-flex items-center gap-2">
                {isBusy && <Loader2 className="animate-spin" aria-hidden="true" />}
                {isSuccess && <Check aria-hidden="true" />}
                {isBusy ? loadingText : isSuccess ? successText : children}
            </span>
        </button>
    );
}
