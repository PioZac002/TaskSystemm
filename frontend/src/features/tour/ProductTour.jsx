import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconArrowLeft, IconArrowRight, IconClose } from "@/components/arcade/icons";
import { cn } from "@/lib/utils";

const MARGIN = 8; // breathing room around the highlighted element
const GAP = 12; // distance between the element and the popover
const POPOVER_WIDTH = 340;

function readRect(selector) {
    if (!selector) return null;
    const element = document.querySelector(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return {
        top: rect.top - MARGIN,
        left: rect.left - MARGIN,
        width: rect.width + MARGIN * 2,
        height: rect.height + MARGIN * 2,
    };
}

/** Places the popover under the target, or above it when there is no room below. */
function placePopover(rect, popoverSize) {
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - 24);
    if (!rect) {
        return {
            top: Math.max(12, window.innerHeight / 2 - popoverSize.height / 2),
            left: Math.max(12, window.innerWidth / 2 - width / 2),
            width,
        };
    }

    const below = rect.top + rect.height + GAP;
    const fitsBelow = below + popoverSize.height <= window.innerHeight - 12;
    const top = fitsBelow ? below : Math.max(12, rect.top - GAP - popoverSize.height);
    const left = Math.min(
        Math.max(12, rect.left + rect.width / 2 - width / 2),
        window.innerWidth - width - 12
    );
    return { top, left, width };
}

/**
 * Guided walkthrough: dims the page, cuts a hole around the current element and
 * explains it. Built in-house because the app scrolls inside .app-main rather than
 * the window, which off-the-shelf tour libraries assume.
 */
export function ProductTour({ steps, open, onClose }) {
    const [index, setIndex] = useState(0);
    const [rect, setRect] = useState(null);
    const [popoverSize, setPopoverSize] = useState({ width: POPOVER_WIDTH, height: 220 });
    const popoverRef = useRef(null);
    const nextButtonRef = useRef(null);

    const step = steps[index];
    const isFirst = index === 0;
    const isLast = index === steps.length - 1;

    const close = useCallback(() => {
        setIndex(0);
        onClose?.();
    }, [onClose]);

    // Reset to the first step whenever the tour is opened again
    useEffect(() => {
        if (open) setIndex(0);
    }, [open]);

    // Bring the target into view, then measure it
    useLayoutEffect(() => {
        if (!open || !step) return undefined;

        const element = step.element ? document.querySelector(step.element) : null;
        element?.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });

        const measure = () => setRect(readRect(step.element));
        measure();

        // The element can move: window resize, app-main scroll, layout settling
        const scroller = document.querySelector(".app-main");
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);
        scroller?.addEventListener("scroll", measure, { passive: true });
        const settle = window.setTimeout(measure, 120);

        return () => {
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
            scroller?.removeEventListener("scroll", measure);
            window.clearTimeout(settle);
        };
    }, [open, step]);

    useLayoutEffect(() => {
        if (!open || !popoverRef.current) return;
        const { width, height } = popoverRef.current.getBoundingClientRect();
        setPopoverSize({ width, height });
    }, [open, index, rect]);

    useEffect(() => {
        if (!open) return undefined;
        nextButtonRef.current?.focus();

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                close();
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                setIndex((i) => (i < steps.length - 1 ? i + 1 : i));
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                setIndex((i) => (i > 0 ? i - 1 : i));
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, steps.length, close]);

    if (!open || !step) return null;

    const position = placePopover(rect, popoverSize);

    return createPortal(
        <div className="tour-root" role="presentation">
            {/* Four panels leave the target uncovered, so it stays readable and clickable-looking */}
            {rect ? (
                <>
                    <div className="tour-shade" style={{ top: 0, left: 0, width: "100%", height: Math.max(0, rect.top) }} />
                    <div className="tour-shade" style={{ top: Math.max(0, rect.top), left: 0, width: Math.max(0, rect.left), height: rect.height }} />
                    <div
                        className="tour-shade"
                        style={{ top: Math.max(0, rect.top), left: rect.left + rect.width, right: 0, height: rect.height }}
                    />
                    <div className="tour-shade" style={{ top: rect.top + rect.height, left: 0, width: "100%", bottom: 0 }} />
                    <div
                        className="tour-ring"
                        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
                        aria-hidden="true"
                    />
                </>
            ) : (
                <div className="tour-shade" style={{ inset: 0 }} />
            )}

            <div
                ref={popoverRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-title"
                className="tour-popover px-chamfer"
                style={{ top: position.top, left: position.left, width: position.width }}
            >
                <button type="button" className="tour-close" onClick={close} aria-label="Close the guide">
                    <IconClose width={16} height={16} aria-hidden="true" />
                </button>

                <h2 id="tour-title" className="tour-title">{step.title}</h2>
                <p className="tour-text">{step.description}</p>

                <div className="tour-footer">
                    <span className="hud tour-progress">{index + 1} / {steps.length}</span>
                    <div className="tour-actions">
                        {!isFirst && (
                            <button type="button" className="tour-btn" onClick={() => setIndex((i) => i - 1)}>
                                <IconArrowLeft width={14} height={14} aria-hidden="true" /> Back
                            </button>
                        )}
                        <button
                            ref={nextButtonRef}
                            type="button"
                            className={cn("tour-btn", "tour-btn-primary")}
                            onClick={() => (isLast ? close() : setIndex((i) => i + 1))}
                        >
                            {isLast ? "Done" : "Next"}
                            {!isLast && <IconArrowRight width={14} height={14} aria-hidden="true" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
