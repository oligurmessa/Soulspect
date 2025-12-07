"use client";

import { Play, Pause } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedVideoPlayerProps {
    src: string;
    poster?: string;
    className?: string;
}

export function OptimizedVideoPlayer({
    src,
    poster,
    className,
}: OptimizedVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isInView, setIsInView] = useState(false);

    // Intersection Observer to handle visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            {
                threshold: 0.5, // 50% visible
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    // Control playback based on visibility
    useEffect(() => {
        if (isInView) {
            // Small delay to ensure smooth start
            const timer = setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.play().catch(() => {
                        // Autoplay prevention logic
                        setIsPlaying(false);
                    });
                    setIsPlaying(true);
                }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            if (videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, [isInView]);

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation(); // Prevent bubbling if container has click handlers
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative h-full w-full overflow-hidden rounded-lg bg-black",
                className
            )}
        >
            <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                poster={poster}
                src={src}
            />

            {/* Sleek Play/Pause Button - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-20">
                <button
                    onClick={togglePlay}
                    className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-105 active:scale-95"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                    type="button"
                >
                    {isPlaying ? (
                        <Pause className="h-4 w-4 fill-current" />
                    ) : (
                        <Play className="h-4 w-4 ml-0.5 fill-current" />
                    )}
                </button>
            </div>
        </div>
    );
}
