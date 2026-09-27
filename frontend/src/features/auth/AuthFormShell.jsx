import React, { forwardRef } from "react";
import { CheckSquare, ShieldCheck, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomGradient = () => (
    <>
        <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
        <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
);

export const LabelInputContainer = ({ children, className }) => (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
        {children}
    </div>
);

export function AuthSubmitButton({ children, disabled, className, type = "submit" }) {
    return (
        <button
            className={cn(
                "group/btn relative block h-11 w-full rounded-md bg-foreground font-medium text-background shadow-input transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.18)] disabled:pointer-events-none disabled:opacity-60 dark:bg-white dark:text-slate-950",
                className
            )}
            type={type}
            disabled={disabled}
        >
            {children}
            <BottomGradient />
        </button>
    );
}

export const AuthCard = forwardRef(
    ({ title, description, children, className, wide = false }, ref) => (
        <div className="auth-page flex min-h-screen items-center justify-center px-4 py-8">
            <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[0.95fr_1fr]">
                <section className="hidden lg:block">
                    <div className="max-w-md">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-foreground text-background shadow-input">
                                <CheckSquare className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">TaskSystem</p>
                                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                    Your workspace is ready.
                                </h1>
                            </div>
                        </div>
                        <div className="mt-8 grid gap-3">
                            <div className="flex gap-3 rounded-lg border border-border bg-card/75 p-4 shadow-sm">
                                <Workflow className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                <div>
                                    <p className="font-medium">Focused project flow</p>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Clean views for the work that needs attention today.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 rounded-lg border border-border bg-card/75 p-4 shadow-sm">
                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                <div>
                                    <p className="font-medium">Secure workspace access</p>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Sign in once and continue where your team left off.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    ref={ref}
                    className={cn(
                        "shadow-input mx-auto w-full rounded-none border border-border bg-card p-5 text-card-foreground md:rounded-lg md:p-8",
                        wide ? "max-w-xl" : "max-w-md",
                        className
                    )}
                >
                    <div className="mb-8">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-background shadow-input dark:bg-white dark:text-slate-950">
                            <CheckSquare className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">{title}</h2>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </section>
            </div>
        </div>
    )
);

AuthCard.displayName = "AuthCard";
