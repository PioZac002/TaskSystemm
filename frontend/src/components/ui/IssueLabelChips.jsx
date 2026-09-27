import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { getLabelName } from "@/utils/labelUtils";

export function IssueLabelChips({ labels = [], max = 3, emptyText = null, className, badgeClassName }) {
    const visibleLabels = (labels || []).filter(Boolean);

    if (visibleLabels.length === 0) {
        return emptyText ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null;
    }

    const shown = visibleLabels.slice(0, max);
    const hiddenCount = Math.max(visibleLabels.length - shown.length, 0);

    return (
        <div className={cn("flex flex-wrap items-center gap-1", className)}>
            {shown.map((label, index) => (
                <Badge
                    key={`${getLabelName(label)}-${label?.id ?? index}`}
                    variant="outline"
                    className={cn("max-w-[9rem] gap-1.5 px-1.5 py-px text-[11px] text-foreground/80", badgeClassName)}
                    title={getLabelName(label)}
                >
                    {/* The label's own color lives in the dot, so any user-picked color stays legible */}
                    <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: label?.color || "var(--color-primary)" }}
                        aria-hidden="true"
                    />
                    <span className="truncate">{getLabelName(label)}</span>
                </Badge>
            ))}
            {hiddenCount > 0 && (
                <Badge
                    variant="secondary"
                    className={cn("px-1.5 py-px text-[11px]", badgeClassName)}
                    title={`${hiddenCount} more label${hiddenCount === 1 ? "" : "s"}`}
                >
                    +{hiddenCount}
                </Badge>
            )}
        </div>
    );
}
