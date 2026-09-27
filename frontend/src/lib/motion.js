/** True when the visitor asked their system to keep motion to a minimum. */
export function prefersReducedMotion() {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Whether a mount animation should run at all.
 *
 * A page that mounts in a hidden tab gets no animation frames, so an entrance
 * that starts at opacity 0 would still be invisible when the visitor switches
 * to it. Nobody is watching that animation anyway, so skip it and render the
 * finished state.
 */
export function shouldAnimateEntrance() {
    if (typeof document === "undefined") return false;
    if (prefersReducedMotion()) return false;
    return document.visibilityState !== "hidden";
}
