import { IconTrash as IconDelete } from "@/components/arcade/icons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function DeleteButton({ onClick, disabled, className = "" }) {
    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            aria-label="Delete"
            className={cn(
                "gap-1.5 border-[var(--px-red)] text-[var(--px-red)] hover:bg-[color-mix(in_srgb,var(--px-red)_12%,transparent)]",
                className
            )}
        >
            <IconDelete aria-hidden="true" />
            <span className="hidden md:inline">Delete</span>
        </Button>
    );
}
