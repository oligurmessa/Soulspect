"use client"

import { motion } from "framer-motion"
import { Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface SettingSection {
    id: string
    label: string
    icon: React.ReactNode
}

interface SettingsSidebarProps {
    sections: SettingSection[]
    activeSection: string
    setActiveSection: (id: string) => void
    onClose: () => void
}

export function SettingsSidebar({
    sections,
    activeSection,
    setActiveSection,
    onClose
}: SettingsSidebarProps) {
    return (
        <div className={cn(
            "flex flex-col",
            "w-full md:w-[240px]",
            "h-auto md:h-full",
            "bg-muted/30", // Semantic token
            "border-b md:border-b-0 md:border-r border-border", // Semantic token
            "p-4"
        )}>
            <DialogHeader className="mb-4 md:mb-6 flex flex-row items-center justify-between md:block">
                <DialogTitle className={cn(
                    "text-xl font-semibold",
                    "text-foreground", // Semantic token
                    "flex items-center gap-2"
                )}>
                    <Settings className="h-5 w-5" />
                    Settings
                </DialogTitle>

                {/* Mobile Close Button (visible only on small screens) */}
                <button
                    onClick={onClose}
                    className="md:hidden p-2 -mr-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                    <X className="w-5 h-5" />
                </button>
            </DialogHeader>

            {/* Navigation Menu */}
            <nav className={cn(
                "flex-1",
                "flex flex-row md:flex-col gap-2",
                "overflow-x-auto md:overflow-visible",
                "-mx-4 px-4 md:mx-0 md:px-0", // Negative margin for edge-to-edge scroll on mobile
                "pb-2 md:pb-0" // Padding for scrollbar
            )}>
                {sections.map((section) => {
                    const isActive = activeSection === section.id

                    return (
                        <motion.button
                            key={section.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                                "flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5",
                                "rounded-xl text-sm font-medium whitespace-nowrap",
                                "transition-all duration-200",
                                "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700",
                                isActive
                                    ? [
                                        "bg-neutral-900 dark:bg-neutral-100",
                                        "text-white dark:text-neutral-900",
                                        "shadow-sm",
                                    ]
                                    : [
                                        "text-neutral-600 dark:text-neutral-400",
                                        "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                                        "hover:text-neutral-900 dark:hover:text-neutral-100",
                                    ]
                            )}
                        >
                            {section.icon}
                            <span className="hidden sm:inline">{section.label}</span>
                            <span className="sm:hidden">{/* Icon only on very small screens? No, label is good if scrollable */} {section.label}</span>
                        </motion.button>
                    )
                })}
            </nav>

            {/* Desktop Close Button (hidden on mobile) */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onClose}
                className={cn(
                    "hidden md:flex items-center gap-2 px-3 py-2.5 mt-auto",
                    "rounded-xl text-sm font-medium",
                    "text-neutral-600 dark:text-neutral-400",
                    "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                    "hover:text-neutral-900 dark:hover:text-neutral-100",
                    "transition-all duration-200",
                    "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700"
                )}
            >
                <X className="w-4 h-4" />
                Close Settings
            </motion.button>
        </div>
    )
}
