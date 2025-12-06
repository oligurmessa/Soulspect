"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingRowProps {
    label: string
    description: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
}

function SettingRow({ label, description, checked, onCheckedChange }: SettingRowProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                    {label}
                </Label>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {description}
                </p>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    )
}

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

interface AppearanceSectionProps {
    reducedMotion: boolean
    setReducedMotion: (value: boolean) => void
    highContrast: boolean
    setHighContrast: (value: boolean) => void
}

export function AppearanceSection({
    reducedMotion, setReducedMotion, highContrast, setHighContrast
}: AppearanceSectionProps) {
    const { theme, setTheme, themes, systemTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Force class update when theme changes
    useEffect(() => {
        if (!mounted) return
        
        const root = document.documentElement
        const actualTheme = theme === 'system' ? systemTheme : theme
        
        // Remove both classes first
        root.classList.remove('light', 'dark')
        
        // Add the correct class
        if (actualTheme === 'dark') {
            root.classList.add('dark')
        } else if (actualTheme === 'light') {
            root.classList.add('light')
        }
        
    }, [theme, systemTheme, resolvedTheme, mounted])

    if (!mounted) {
        return null
    }

    return (
        <div className="space-y-6">
            {/* Theme Selection */}
            <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Theme
                </h3>
                <RadioGroup value={theme} onValueChange={setTheme}>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
                            { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
                            { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> }
                        ].map((option) => (
                            <label
                                key={option.value}
                                className={cn(
                                    "relative flex flex-col items-center gap-2 p-4 cursor-pointer",
                                    "rounded-xl border-2 transition-all duration-200",
                                    theme === option.value
                                        ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800/30"
                                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                                )}
                            >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                {option.icon}
                                <span className="text-sm font-medium">{option.label}</span>
                                {theme === option.value && (
                                    <div className="absolute -top-2 -right-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-100">
                                            <Check className="h-3 w-3 text-white dark:text-neutral-900" strokeWidth={3} />
                                        </span>
                                    </div>
                                )}
                            </label>
                        ))}
                    </div>
                </RadioGroup>
            </div>

            <div className="pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50">
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        Accessibility
                    </h3>
                    <div className="space-y-4">
                        <SettingRow
                            label="Reduce motion"
                            description="Minimize animations throughout the app"
                            checked={reducedMotion}
                            onCheckedChange={setReducedMotion}
                        />
                        <SettingRow
                            label="High contrast"
                            description="Increase contrast for better visibility"
                            checked={highContrast}
                            onCheckedChange={setHighContrast}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
