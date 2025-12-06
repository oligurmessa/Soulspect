"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface PreferencesSectionProps {
    startWeekOn: boolean
    setStartWeekOn: (value: boolean) => void
    timeFormat24: boolean
    setTimeFormat24: (value: boolean) => void
    compactMode: boolean
    setCompactMode: (value: boolean) => void
    autoSave: boolean
    setAutoSave: (value: boolean) => void
    spellCheck: boolean
    setSpellCheck: (value: boolean) => void
    fontSize: string
    setFontSize: (value: string) => void
}

export function PreferencesSection({
    startWeekOn, setStartWeekOn, timeFormat24, setTimeFormat24,
    compactMode, setCompactMode, autoSave, setAutoSave, spellCheck, setSpellCheck,
    fontSize, setFontSize
}: PreferencesSectionProps) {
    return (
        <div className="space-y-6">
            {/* General Preferences */}
            <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    General Preferences
                </h3>
                <div className="space-y-4">
                    <SettingRow
                        label="Start week on Monday"
                        description="This will change how all calendars in your app look."
                        checked={startWeekOn}
                        onCheckedChange={setStartWeekOn}
                    />
                    <SettingRow
                        label="24-hour time format"
                        description="Display time in 24-hour format instead of AM/PM"
                        checked={timeFormat24}
                        onCheckedChange={setTimeFormat24}
                    />
                    <SettingRow
                        label="Compact mode"
                        description="Reduce spacing between elements for more content"
                        checked={compactMode}
                        onCheckedChange={setCompactMode}
                    />
                </div>
            </div>

            {/* Editor Preferences */}
            <div className="pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Editor Preferences
                </h3>
                <div className="space-y-4">
                    <SettingRow
                        label="Auto-save"
                        description="Automatically save changes as you type"
                        checked={autoSave}
                        onCheckedChange={setAutoSave}
                    />
                    <SettingRow
                        label="Spell check"
                        description="Check spelling as you type"
                        checked={spellCheck}
                        onCheckedChange={setSpellCheck}
                    />

                    <div>
                        <Label className="text-neutral-900 dark:text-neutral-100 mb-2 block">
                            Default font size
                        </Label>
                        <Select value={fontSize} onValueChange={setFontSize}>
                            <SelectTrigger className={cn(
                                "w-full rounded-xl",
                                "bg-white/50 dark:bg-neutral-800/30",
                                "border-neutral-200/50 dark:border-neutral-800/50"
                            )}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                                <SelectItem value="extra-large">Extra Large</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    )
}
