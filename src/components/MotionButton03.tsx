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
                        <Check className="w-4 h-4" />
                        <span>Saved</span>
                    </>
                );
            case "saving":
                return (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
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
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                    </>
                );
            case "updated":
                return (
                    <>
                        <Check className="w-4 h-4" />
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
                "h-10 px-5 rounded-lg w-[100px]", // Fixed width to prevent layout shifts
                "flex items-center justify-center gap-2",
                "text-sm font-medium",
                "transition-all duration-300",
                // Loading states
                (buttonState === "saving" || buttonState === "updating") &&
                    "bg-white/5 dark:bg-zinc-800/90 ring-1 ring-blue-500/20 dark:ring-blue-500/30 cursor-wait",
                // Final states (unclickable)
                buttonState === "saved" &&
                    "bg-green-500/10 dark:bg-green-500/20 ring-1 ring-green-500/20 dark:ring-green-500/30 cursor-not-allowed",
                buttonState === "updated" &&
                    "bg-blue-500/10 dark:bg-blue-500/20 ring-1 ring-blue-500/20 dark:ring-blue-500/30 cursor-not-allowed",
                // Default clickable states
                (buttonState === "done" || buttonState === "update") &&
                    "bg-zinc-900 dark:bg-zinc-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
                "shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
                "backdrop-blur-xs",
                className
            )}
            onClick={handleClick}
            whileHover={{ 
                scale: (buttonState === "done" || buttonState === "update") ? 1.01 : 1 
            }}
            whileTap={{ 
                scale: (buttonState === "done" || buttonState === "update") ? 0.98 : 1 
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Background Gradient Animation */}
            <AnimatePresence>
                {(buttonState === "saving" || buttonState === "updating") && (
                    <motion.div
                        className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-blue-600/10
                                     dark:from-blue-900/30 dark:to-blue-800/30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </AnimatePresence>

            {/* Content */}
            <div
                className={cn(
                    "relative flex items-center gap-2 justify-center",
                    // Loading states
                    (buttonState === "saving" || buttonState === "updating") &&
                        "text-blue-500 dark:text-blue-400",
                    // Final states  
                    buttonState === "saved" &&
                        "text-green-600 dark:text-green-400",
                    buttonState === "updated" &&
                        "text-blue-600 dark:text-blue-400",
                    // Default clickable states
                    (buttonState === "done" || buttonState === "update") &&
                        "text-white dark:text-zinc-900"
                )}
            >
                {getButtonContent()}
            </div>

            {/* Progress Bar */}
            <AnimatePresence>
                {(buttonState === "saving" || buttonState === "updating") && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 h-[1px] bg-linear-to-r from-blue-400/50 via-blue-500/50 to-transparent"
                        initial={{ scaleX: 1, opacity: 0 }}
                        animate={{ scaleX: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            scaleX: {
                                duration: loadingDuration / 1000,
                                ease: "linear"
                            },
                            opacity: {
                                duration: 0.2,
                                ease: "easeOut"
                            }
                        }}
                        style={{ transformOrigin: "left" }}
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );
}