import {
    IconCritical,
    IconEye,
    IconHigh,
    IconLow,
    IconProgress,
    IconSkull,
    IconSpawn,
    IconStar,
    IconTodo,
    IconTriage,
    IconWaiting,
} from "@/components/arcade/icons";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/utils/issueConstants";
import { cn } from "@/lib/utils";

// One glyph per status: the state reads without color
const STATUS_GLYPHS = {
    NEW: IconSpawn,
    TRIAGE: IconTriage,
    TODO: IconTodo,
    IN_PROGRESS: IconProgress,
    WAITING_FOR_TEAM: IconWaiting,
    CODE_REVIEW: IconEye,
    DONE: IconStar,
    CANCELED: IconSkull,
};

export function StatusGlyph({ status, className, size = 16 }) {
    const Glyph = STATUS_GLYPHS[status] || IconSpawn;
    return (
        <Glyph
            width={size}
            height={size}
            aria-hidden="true"
            className={cn("st-ink shrink-0", `st-${status || "NEW"}`, className)}
            style={{ shapeRendering: "crispEdges" }}
        />
    );
}

export function StatusChip({ status, className }) {
    return (
        <span className={cn("st-chip", `st-${status || "NEW"}`, className)}>
            <StatusGlyph status={status} size={12} />
            {STATUS_LABELS[status] || status || "New"}
        </span>
    );
}

const PRIORITY_GLYPHS = { LOW: IconLow, NORMAL: null, HIGH: IconHigh, CRITICAL: IconCritical };

export function PriorityMark({ priority, className }) {
    if (!priority) return null;
    const Glyph = PRIORITY_GLYPHS[priority];
    const hot = priority === "HIGH" || priority === "CRITICAL";
    return (
        <span
            className={cn(
                "hud inline-flex items-center gap-0.5 text-[0.6875rem]",
                hot ? "text-[var(--px-red)]" : "text-muted-foreground",
                className
            )}
        >
            {Glyph && <Glyph width={12} height={12} aria-hidden="true" style={{ shapeRendering: "crispEdges" }} />}
            {PRIORITY_LABELS[priority] || priority}
        </span>
    );
}

export function PxMeter({ value = 0, color, className, label }) {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    return (
        <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clamped}
            aria-label={label}
            className={cn("px-meter", className)}
            style={{ "--fill-ratio": clamped / 100, ...(color ? { "--meter-color": color } : null) }}
        />
    );
}
