"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RotateCcw, Check, ChevronDown, Copy, Trash2 } from "lucide-react";
import { GeminiSparkle } from "@/components/ui/icons/gemini-sparkle";
import { useState } from "react";

export type ReflectionPriority = "low" | "medium" | "high";
export type ReflectionState = "loading" | "ready" | "accepted";

export interface ReflectionSuggestion {
    id: string;
    title: string;
    description: string;
    priority: ReflectionPriority;
}

interface ReflectionBlockProps {
    suggestion: ReflectionSuggestion | null;
    state: ReflectionState;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onAccept?: () => void;
    onDecline?: () => void;
    onRetry?: () => void;
    onCopy?: () => void;
    onDelete?: () => void;
}

export function ReflectionBlock({
    suggestion,
    state,
    isCollapsed,
    onToggleCollapse,
    onAccept,
    onDecline,
    onRetry,
    onCopy,
    onDelete,
}: ReflectionBlockProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        onCopy?.();
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const isAccepted = state === "accepted";
    const isLoading = state === "loading";

    return (
        <div
            className={cn(
                "w-full my-3 rounded-lg border relative transition-all duration-200",
                isAccepted
                    ? "bg-white/50 dark:bg-zinc-900/30 border-gray-100 dark:border-zinc-800/40"
                    : "bg-gray-50/80 dark:bg-zinc-900/60 border-gray-200 dark:border-zinc-700/60",
                isAccepted && isCollapsed ? "py-2 px-3" : "p-4"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <button
                    onClick={onToggleCollapse}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                    <ChevronDown
                        className={cn(
                            "w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 flex-shrink-0",
                            isCollapsed && "-rotate-90"
                        )}
                    />
                    <div
                        className={cn(
                            "flex items-center gap-1.5 flex-shrink-0",
                            isAccepted
                                ? "text-gray-400 dark:text-gray-500"
                                : "text-[#ff9066] dark:text-[#ff9066]"
                        )}
                    >
                        <GeminiSparkle className={cn("w-3.5 h-3.5", isLoading && "animate-pulse")} />
                        <span className="text-xs font-medium uppercase tracking-wide">
                            {isLoading ? "Reflecting…" : "AI Reflection"}
                        </span>
                    </div>

                    {/* Collapsed preview */}
                    {isCollapsed && suggestion && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 truncate ml-2">
                            {suggestion.title}
                        </span>
                    )}
                </button>

                {/* Action buttons */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    {isLoading && onRetry && (
                        <IconButton onClick={onRetry} title="Retry">
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        </IconButton>
                    )}

                    {!isLoading && onRetry && (
                        <IconButton onClick={onRetry} title="Retry">
                            <RotateCcw className="w-3.5 h-3.5" />
                        </IconButton>
                    )}

                    {!isLoading && onCopy && (
                        <IconButton onClick={handleCopy} title="Copy">
                            {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                        </IconButton>
                    )}

                    {onDelete && (
                        <IconButton onClick={onDelete} title="Delete" variant="danger">
                            <Trash2 className="w-3.5 h-3.5" />
                        </IconButton>
                    )}
                </div>
            </div>

            {/* Expandable content */}
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pt-3 pl-6">
                            {isLoading ? (
                                <LoadingSkeleton />
                            ) : suggestion ? (
                                <ReflectionContent
                                    suggestion={suggestion}
                                    showActions={!isAccepted}
                                    onAccept={onAccept}
                                    onDecline={onDecline}
                                />
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function IconButton({
    onClick,
    title,
    variant = "default",
    children,
}: {
    onClick?: () => void;
    title: string;
    variant?: "default" | "danger";
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn(
                "p-1.5 rounded-md transition-colors",
                variant === "danger"
                    ? "text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
            )}
        >
            {children}
        </button>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-2 py-1">
            <div className="h-4 w-2/5 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
    );
}

function ReflectionContent({
    suggestion,
    showActions,
    onAccept,
    onDecline,
}: {
    suggestion: ReflectionSuggestion;
    showActions: boolean;
    onAccept?: () => void;
    onDecline?: () => void;
}) {
    return (
        <>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                {suggestion.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {suggestion.description}
            </p>

            {showActions && (
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/50">
                    {onDecline && (
                        <button
                            onClick={onDecline}
                            className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Dismiss
                        </button>
                    )}
                    {onAccept && (
                        <button
                            onClick={onAccept}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Keep
                        </button>
                    )}
                </div>
            )}
        </>
    );
}