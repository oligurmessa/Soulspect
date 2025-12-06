"use client"

import * as React from "react"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SleekDrawerProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    triggerText?: string
    children?: React.ReactNode
    currentStep?: number
    totalSteps?: number
    onBack?: () => void
    onNext?: () => void
    onDone?: () => void
    onClose?: () => void
    showNavigation?: boolean
}

const ANIMATION = {
    drawer: {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
        transition: { type: "spring", damping: 30, stiffness: 300 } as const,
    },
    content: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
    },
}

// =============================================================================
// Component
// =============================================================================

export function SleekDrawer({
    open,
    onOpenChange,
    triggerText,
    children,
    currentStep = 1,
    totalSteps = 1,
    onBack,
    onNext,
    onDone,
    onClose,
    showNavigation = true,
}: SleekDrawerProps) {
    const canGoBack = currentStep > 1
    const canGoNext = currentStep < totalSteps

    // Handle internal close if onOpenChange is provided
    const handleClose = () => {
        if (onClose) {
            onClose()
        } else if (onOpenChange) {
            onOpenChange(false)
        }
    }

    const handleNextOrDone = () => {
        if (canGoNext) {
            onNext?.()
        } else {
            if (onDone) {
                onDone()
            } else {
                handleClose()
            }
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {triggerText && (
                <DrawerTrigger asChild>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "h-10 px-6 rounded-xl",
                            "bg-white/80 dark:bg-neutral-900/80",
                            "backdrop-blur-xl",
                            "border border-neutral-200/50 dark:border-neutral-800/50",
                            "text-neutral-900 dark:text-neutral-100",
                            "font-medium text-sm",
                            "shadow-sm",
                            "hover:bg-white/90 dark:hover:bg-neutral-900/90",
                            "transition-all duration-200",
                            "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700"
                        )}
                    >
                        {triggerText}
                    </motion.button>
                </DrawerTrigger>
            )}

            <DrawerContent
                className={cn(
                    "bg-white/80 dark:bg-neutral-950/90",
                    "backdrop-blur-xl",
                    "border-t border-neutral-200/50 dark:border-neutral-800/50",
                    "shadow-xl",
                    "rounded-t-3xl",
                    "outline-none",
                    "max-w-2xl mx-auto",
                    "h-[400px]" // Fixed height
                )}
            >
                <motion.div
                    {...ANIMATION.drawer}
                    className="relative h-full flex flex-col p-4"
                >
                    <DrawerTitle className="sr-only">Navigation</DrawerTitle>
                    {/* ===================================================================
              HEADER - Navigation arrows and close button
              =================================================================== */}
                    <div className="flex items-center justify-between mb-2">
                        {/* Left: Back Button */}
                        <div className="w-24 flex justify-start">
                            {showNavigation && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onBack}
                                    disabled={!canGoBack}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl",
                                        "text-sm font-medium",
                                        "transition-all duration-200",
                                        "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700",
                                        canGoBack
                                            ? [
                                                "text-neutral-600 dark:text-neutral-400",
                                                "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                                                "hover:text-neutral-900 dark:hover:text-neutral-100",
                                            ]
                                            : "text-neutral-300 dark:text-neutral-800 cursor-not-allowed"
                                    )}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back
                                </motion.button>
                            )}
                        </div>

                        {/* Drag Handle */}
                        <div className="flex justify-center flex-1">
                            <div className="w-12 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                        </div>

                        {/* Right: Next / Done Button */}
                        <div className="w-24 flex justify-end">
                            {showNavigation && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleNextOrDone}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl",
                                        "text-sm font-medium",
                                        "transition-all duration-200",
                                        "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700",
                                        "text-neutral-600 dark:text-neutral-400",
                                        "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                                        "hover:text-neutral-900 dark:hover:text-neutral-100"
                                    )}
                                >
                                    {canGoNext ? (
                                        <>
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            Done
                                            <Check className="w-4 h-4" />
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* ===================================================================
              CONTENT AREA - Fixed height, centered
              =================================================================== */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                {...ANIMATION.content}
                                className="w-full h-full"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ===================================================================
              CLOSE BUTTON - Bottom center
              =================================================================== */}
                    <div className="flex justify-center pt-2"> {/* Reduced padding */}
                        <DrawerClose asChild>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleClose}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl",
                                    "text-sm font-medium",
                                    "text-neutral-600 dark:text-neutral-400",
                                    "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                                    "hover:text-neutral-900 dark:hover:text-neutral-100",
                                    "transition-all duration-200",
                                    "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700"
                                )}
                            >
                                <X className="w-4 h-4" />
                                Close
                            </motion.button>
                        </DrawerClose>
                    </div>
                </motion.div>
            </DrawerContent>
        </Drawer>
    )
}
