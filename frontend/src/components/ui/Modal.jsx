import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn.js";

export function Modal({ open, onClose, children, className = "" }) {
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        const handler = (e) => (e.key === "Escape" ? onClose?.() : null);
        document.addEventListener("keydown", handler);
        return () => {
            document.body.style.overflow = "auto";
            document.removeEventListener("keydown", handler);
        };
    }, [open, onClose]);

    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
             onClick={onClose}>
            <div
                className={cn("bg-white rounded-xl relative shadow-xl max-w-lg w-full p-6", className)}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                {children}
                <button
                    aria-label="Close modal"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                >
                    &times;
                </button>
            </div>
        </div>,
        document.body
    );
}
