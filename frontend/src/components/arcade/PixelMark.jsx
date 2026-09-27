import { cn } from "@/lib/utils";

// TaskSystem mark: a 10x10 sprite of a ticket tile with a checkmark punched through it.
// Drawn on the pixel grid (crispEdges) so it stays sharp at 16px.
const CHECK = [
    [7, 3], [6, 4], [7, 4], [2, 5], [5, 5], [6, 5], [2, 6], [3, 6], [4, 6], [5, 6], [3, 7], [4, 7],
];

export function PixelMark({ className, size = 28, title = "TaskSystem" }) {
    return (
        <svg
            viewBox="0 0 10 10"
            width={size}
            height={size}
            role="img"
            aria-label={title}
            shapeRendering="crispEdges"
            className={cn("shrink-0", className)}
        >
            <path d="M1 0h8v1h1v8h-1v1H1v-1H0V1h1z" fill="var(--color-primary)" />
            <path d="M1 1h8v1H1z" fill="color-mix(in srgb, var(--color-primary-foreground) 22%, transparent)" />
            {CHECK.map(([x, y]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--px-gold)" />
            ))}
        </svg>
    );
}

export function Wordmark({ className, size = 28 }) {
    return (
        <span className={cn("inline-flex items-center gap-2.5", className)}>
            <PixelMark size={size} />
            <span className="font-pixel text-lg font-bold leading-none tracking-normal">TaskSystem</span>
        </span>
    );
}
