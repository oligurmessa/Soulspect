"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
    className?: string
    message?: string
    fullScreen?: boolean
}

export function PageLoader({ className, message, fullScreen = false }: PageLoaderProps) {
    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            {message && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">
                    {message}
                </p>
            )}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
                {content}
            </div>
        )
    }

    return (
        <div className="flex flex-1 items-center justify-center min-h-[50vh]">
            {content}
        </div>
    )
}
