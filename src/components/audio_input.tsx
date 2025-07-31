"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Camera,
    Mic,
    Video,
    Loader2,
    CheckCircle2,
    XCircle,
} from "lucide-react";

interface Input09Props extends React.InputHTMLAttributes<HTMLInputElement> {
    mode?: "video" | "audio" | "camera";
    status?: "idle" | "recording" | "processing" | "success" | "error";
    onRecord?: () => Promise<void>;
    onStop?: () => void;
    duration?: number;
}

const Input09 = React.forwardRef<HTMLInputElement, Input09Props>(
    (
        {
            className,
            mode = "video",
            status = "idle",
            onRecord,
            onStop,
            duration = 0,
            ...props
        },
        ref
    ) => {
        const getIcon = () => {
            switch (mode) {
                case "video":
                    return <Video className="w-4 h-4" />;
                case "audio":
                    return <Mic className="w-4 h-4" />;
                case "camera":
                    return <Camera className="w-4 h-4" />;
            }
        };

        const getStatusColor = () => {
            switch (status) {
                case "recording":
                    return "text-red-500";
                case "processing":
                    return "text-blue-500";
                case "success":
                    return "text-green-500";
                case "error":
                    return "text-red-500";
                default:
                    return "text-zinc-500 dark:text-zinc-400";
            }
        };

        return (
            <div
                className={cn(
                    "relative",
                    "bg-zinc-100 dark:bg-zinc-800",
                    "border border-zinc-200 dark:border-transparent",
                    "rounded-xl",
                    "transition-colors",
                    "duration-200",
                    "hover:border-zinc-300 dark:hover:border-zinc-700",
                    status === "recording" &&
                        "border-red-200 dark:border-red-500/30",
                    className
                )}
            >
                <div className="relative flex items-center h-11">
                    {/* Mode indicator */}
                    <div
                        className={cn(
                            "absolute left-0 inset-y-0 w-11",
                            "flex items-center justify-center",
                            "border-r border-zinc-200 dark:border-zinc-700",
                            status === "recording" &&
                                "border-red-200 dark:border-red-500/30",
                            getStatusColor()
                        )}
                    >
                        {status === "processing" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : status === "success" ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : status === "error" ? (
                            <XCircle className="w-4 h-4" />
                        ) : (
                            getIcon()
                        )}
                    </div>

                    <input
                        ref={ref}
                        {...props}
                        className={cn(
                            "flex-1 h-11",
                            "bg-transparent pl-14 pr-32",
                            "text-sm text-zinc-900 dark:text-zinc-100",
                            "placeholder:text-zinc-500",
                            "focus:outline-hidden"
                        )}
                    />

                    {/* Recording indicator and action button container */}
                    <div
                        className={cn(
                            "absolute right-3",
                            "flex items-center gap-3"
                        )}
                    >
                        {/* Recording indicator */}
                        {status === "recording" && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-sm font-medium text-red-500 dark:text-red-400 tabular-nums">
                                    {Math.floor(duration / 60)}:
                                    {(duration % 60)
                                        .toString()
                                        .padStart(2, "0")}
                                </span>
                            </div>
                        )}

                        {/* Action button */}
                        <button
                            onClick={status === "recording" ? onStop : onRecord}
                            className={cn(
                                "px-3 h-7 rounded-lg",
                                "text-sm font-medium",
                                "transition-colors duration-200",
                                status === "recording"
                                    ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30"
                                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                            )}
                        >
                            {status === "recording" ? "Stop" : "Record"}
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                {status === "processing" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5">
                        <div className="h-full bg-zinc-500 animate-progress" />
                    </div>
                )}
            </div>
        );
    }
);

Input09.displayName = "Input09";

export default Input09;
