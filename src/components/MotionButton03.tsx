"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react"; // Import useEffect
import { Check, Loader2, RefreshCcw } from "lucide-react"; // Import new icons
import { cn } from "@/lib/utils";

interface MotionButtonProps {
    children: React.ReactNode;
    onLoad?: () => Promise<void>;
    className?: string;
    loadingDuration?: number;
    initialState?: "update" | "done" | "saved" | "saving" | "updating" | "updated";
}

export default function MotionButton03({
    children = "Update", // Default children updated
    onLoad,
    className = "",
    loadingDuration = 2000,
    initialState = "update", // Default initial state
}: MotionButtonProps) {
    const [buttonState, setButtonState] = useState<"done" | "saved" | "saving" | "update" | "updating" | "updated">(initialState);

    // Update button state if initialState prop changes
    useEffect(() => {
        setButtonState(initialState);
    }, [initialState]);

    const handleClick = async () => {
        // Don't allow clicks when in loading states or final states (saved/updated)
        if (buttonState === "saving" || buttonState === "updating" || buttonState === "saved" || buttonState === "updated") return;

        let originalState = buttonState;

        // Determine the intermediate state based on the current state
        if (buttonState === "update") {
            setButtonState("updating");
        } else if (buttonState === "done") {
            setButtonState("saving");
        }

        try {
            await onLoad?.();
            // Determine the final state based on the original state
            if (originalState === "update") {
                setButtonState("updated"); // Stays updated and unclickable
            } else if (originalState === "done") {
                setButtonState("saved"); // Stays saved and unclickable
            }
        } catch (error) {
            // On error, revert to original state
            setButtonState(originalState);
        }
    };

    const getButtonContent = () => {
        switch (buttonState) {
            case "done":
                return (
                    <>
                        <span>Done</span>
                    </>
                );
            case "saved":
                return (
                    <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                    </>
                );
            case "saving":
                return (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving</span>
                    </>
                );
            case "update":
                return (
                    <>
                        <span>Update</span>
                    </>
                );
            case "updating":
                return (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating</span>
                    </>
                );
            case "updated":
                return (
                    <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Updated</span>
                    </>
                );
            default:
                return (
                    <>
                        <span>{children}</span>
                    </>
                );
        }
    };

    return (
        <motion.button
            className={cn(
                "relative group overflow-hidden",
                "h-9 px-4 rounded-lg min-w-[90px]", // Slightly smaller, min-width instead of fixed
                "flex items-center justify-center gap-2",
                "text-sm font-medium",
                "transition-all duration-200",
                // Loading states
                (buttonState === "saving" || buttonState === "updating") &&
                    "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-wait",
                // Final states (unclickable)
                buttonState === "saved" &&
                    "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 cursor-not-allowed",
                buttonState === "updated" &&
                    "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 cursor-not-allowed",
                // Default clickable states
                (buttonState === "done" || buttonState === "update") &&
                    "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200",
                "border border-transparent",
                className
            )}
            onClick={handleClick}
            whileHover={{ 
                scale: (buttonState === "done" || buttonState === "update") ? 1.02 : 1 
            }}
            whileTap={{ 
                scale: (buttonState === "done" || buttonState === "update") ? 0.98 : 1 
            }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={buttonState}
                    className="relative flex items-center gap-1.5 justify-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                >
                    {getButtonContent()}
                </motion.div>
            </AnimatePresence>

            {/* Subtle loading indicator */}
            <AnimatePresence>
                {(buttonState === "saving" || buttonState === "updating") && (
                    <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-zinc-400 dark:bg-zinc-600"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: loadingDuration / 1000,
                            ease: "linear"
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );
}