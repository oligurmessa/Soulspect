"use client";

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Volume2, Play, Pause, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Waveform component
const Waveform = ({ isPlaying, progress }: { isPlaying: boolean; progress: number }) => {
    const [bars, setBars] = useState<number[]>([]);
    const barCount = 60; // Number of bars in the waveform

    // Generate random heights for the waveform bars on initial render
    useEffect(() => {
        const generatedBars = Array.from({ length: barCount }, () => 
            20 + Math.random() * 80
        );
        setBars(generatedBars);
    }, []);

    return (
        <div className="absolute inset-0 flex items-center justify-between px-1">
            {/* Background (unplayed) waveform */}
            {bars.map((height, i) => (
                <div
                    key={`bg-bar-${i}`}
                    className="w-0.5 rounded-full bg-zinc-300 dark:bg-zinc-600"
                    style={{ height: `${height}%` }}
                />
            ))}
            {/* Foreground (played) waveform, clipped by progress */}
            <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${progress}%` }}
            >
                <div className="absolute inset-0 flex items-center justify-between px-1">
                    {bars.map((height, i) => (
                        <div
                            key={`fg-bar-${i}`}
                            className="w-0.5 rounded-full bg-emerald-500"
                            style={{
                                height: `${height}%`,
                                animation: isPlaying
                                    ? `wave 1.2s ease-in-out ${i * 0.05}s infinite alternate`
                                    : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

interface AudioPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
    status?: "idle" | "loading" | "playing" | "paused" | "success" | "error";
    onPlay?: () => void;
    onStop?: () => void;
    onProgressClick?: (progress: number) => void;
    progress?: number;
    duration?: number;
    currentTime?: number;
}

// The AudioPlayer component
const AudioPlayer = forwardRef<HTMLDivElement, AudioPlayerProps>(
    (
        {
            className,
            status = "idle",
            onPlay,
            onStop,
            onProgressClick,
            progress = 0,
            duration = 0,
            currentTime = 0,
            ...props
        },
        ref
    ) => {
        const progressBarRef = useRef<HTMLDivElement>(null);

        const getStatusColor = () => {
            switch (status) {
                case "playing":
                    return "text-green-500";
                case "loading":
                    return "text-blue-500";
                case "success":
                    return "text-green-500";
                case "error":
                    return "text-red-500";
                default:
                    return "text-zinc-500 dark:text-zinc-400";
            }
        };

        const handleProgressBarClick = (e: React.MouseEvent) => {
            if (!progressBarRef.current || !onProgressClick) return;

            const rect = progressBarRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const progressPercent = (clickX / rect.width) * 100;
            const clampedProgress = Math.max(0, Math.min(100, progressPercent));
            
            onProgressClick(clampedProgress);
        };

        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, "0")}`;
        };

        return (
            <>
                {/* Add keyframes for the waveform animation */}
                <style jsx>{`
                    @keyframes wave {
                        0% { transform: scaleY(0.3); }
                        50% { transform: scaleY(1); }
                        100% { transform: scaleY(0.3); }
                    }
                `}</style>
                <div
                    ref={ref}
                    className={cn(
                        "relative w-full max-w-md",
                        "bg-zinc-100 dark:bg-zinc-800",
                        "border border-zinc-200 dark:border-transparent",
                        "rounded-xl",
                        "transition-colors",
                        "duration-200",
                        "hover:border-zinc-300 dark:hover:border-zinc-700",
                        status === "playing" &&
                            "border-green-200 dark:border-green-500/30",
                        className
                    )}
                    {...props}
                >
                    <div className="relative flex items-center h-14 pl-14 pr-14">
                        {/* Audio indicator (left side) */}
                        <div
                            className={cn(
                                "absolute left-0 inset-y-0 w-14",
                                "flex items-center justify-center",
                                "border-r border-zinc-200 dark:border-zinc-700",
                                "rounded-l-xl",
                                status === "playing" &&
                                    "border-green-200 dark:border-green-500/30",
                                getStatusColor()
                            )}
                        >
                            {status === "loading" ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : status === "success" ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : status === "error" ? (
                                <XCircle className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </div>

                        {/* Progress bar area */}
                        <div    
                            ref={progressBarRef}
                            className="flex-1 h-full relative cursor-pointer flex items-center"
                            onClick={handleProgressBarClick}
                        >
                            {/* The Waveform component */}
                            <Waveform isPlaying={status === 'playing'} progress={progress} />
                            
                            {/* Time display overlay, with a higher z-index to appear on top */}
                            <div className="relative z-10 w-full px-4">
                                <div className="flex justify-between">
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400 tabular-nums font-mono bg-zinc-100/50 dark:bg-zinc-800/50 px-1 rounded">
                                        {formatTime(currentTime)}
                                    </span>
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400 tabular-nums font-mono bg-zinc-100/50 dark:bg-zinc-800/50 px-1 rounded">
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Play/Pause icon button (right side) */}
                        <button
                            onClick={status === 'playing' ? onStop : onPlay}
                            disabled={status === "loading" || status === "error"}
                            className={cn(
                                "absolute right-0 inset-y-0 w-14",
                                "flex items-center justify-center",
                                "border-l border-zinc-200 dark:border-zinc-700",
                                "rounded-r-xl",
                                "transition-colors duration-200",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-100 dark:focus:ring-offset-zinc-800",
                                status === "playing" 
                                    ? "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 focus:ring-zinc-400" 
                                    : "text-green-500 hover:bg-green-500/10 focus:ring-green-500",
                                status === "playing" && "border-green-200 dark:border-green-500/30"
                            )}
                            aria-label={status === 'playing' ? 'Pause' : 'Play'}
                        >
                            {status === 'playing' ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </>
        );
    }
);

AudioPlayer.displayName = "AudioPlayer";

export default AudioPlayer;