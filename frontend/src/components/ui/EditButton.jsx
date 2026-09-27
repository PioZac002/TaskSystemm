import { IconPencil as IconEdit } from "@/components/arcade/icons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function EditButton({ onClick, disabled, className = "" }) {
    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            aria-label="Edit"
            className={cn("gap-1.5", className)}
        >
            <IconEdit aria-hidden="true" />
            <span className="hidden md:inline">Edit</span>
        </Button>
    );
}
