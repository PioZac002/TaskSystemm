import { IconPlus } from "@/components/arcade/icons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function AddButton({ label = "Add", onClick, className = "", variant = "default" }) {
    return (
        <Button type="button" variant={variant} onClick={onClick} className={cn("shrink-0 gap-1.5 pl-3 font-semibold", className)}>
            <IconPlus aria-hidden="true" />
            {label}
        </Button>
    );
}
