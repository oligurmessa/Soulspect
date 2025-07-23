"use client";

import { Video, VideoOff } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function AI_Video() {
    const [recording, setRecording] = useState(false);
    const [time, setTime] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [isDemo, setIsDemo] = useState(true);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (recording) {
            intervalId = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);
        } else {
            setTime(0);
        }

        return () => clearInterval(intervalId);
    }, [recording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    /**
     * Remove that, only used for demo
     */
    useEffect(() => {
        if (!isDemo) return;

        let timeoutId: NodeJS.Timeout;
        const runAnimation = () => {
            setRecording(true);
            timeoutId = setTimeout(() => {
                setRecording(false);
                timeoutId = setTimeout(runAnimation, 1000);
            }, 4000);
        };

        const initialTimeout = setTimeout(runAnimation, 100);
        return () => {
            clearTimeout(timeoutId);
            clearTimeout(initialTimeout);
        };
    }, [isDemo]);

    const handleClick = () => {
        if (isDemo) {
            setIsDemo(false);
            setRecording(false);
        } else {
            setRecording((prev) => !prev);
        }
    };

    return (
        <div className="w-full py-4">
            <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
                <button
                    className={cn(
                        "group w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300",
                        recording
                            ? "bg-red-500/10 border-2 border-red-500/30"
                            : "bg-none hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                    type="button"
                    onClick={handleClick}
                >
                    {recording ? (
                        <div className="relative">
                            <Video className="w-6 h-6 text-red-500" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        </div>
                    ) : (
                        <VideoOff className="w-6 h-6 text-black/90 dark:text-white/90" />
                    )}
                </button>

                <span
                    className={cn(
                        "font-mono text-sm transition-opacity duration-300",
                        recording
                            ? "text-red-500/90"
                            : "text-black/30 dark:text-white/30"
                    )}
                >
                    {formatTime(time)}
                </span>

                {/* Video Frame Visualization */}
                <div className="h-16 w-64 flex items-center justify-center gap-1">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-4 h-12 rounded-sm transition-all duration-500",
                                recording
                                    ? "bg-gradient-to-t from-red-500/20 to-red-500/60 animate-pulse"
                                    : "bg-black/10 dark:bg-white/10 h-6"
                            )}
                            style={
                                recording && isClient
                                    ? {
                                          height: `${30 + Math.random() * 70}%`,
                                          animationDelay: `${i * 0.1}s`,
                                          transform: `scaleY(${0.5 + Math.random() * 0.5})`,
                                      }
                                    : undefined
                            }
                        />
                    ))}
                </div>

                {/* Processing Indicator */}
                {recording && (
                    <div className="flex items-center gap-1">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.2}s` }}
                            />
                        ))}
                    </div>
                )}

                <p className="h-4 text-xs text-black/70 dark:text-white/70">
                    {recording ? "Recording..." : "Click to record"}
                </p>
            </div>
        </div>
    );
}