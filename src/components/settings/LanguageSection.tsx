"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface LanguageSectionProps {
    language: string
    setLanguage: (value: string) => void
    timezone: string
    setTimezone: (value: string) => void
    autoTimezone: boolean
    setAutoTimezone: (value: boolean) => void
}

export function LanguageSection({
    language, setLanguage, timezone, setTimezone, autoTimezone, setAutoTimezone
}: LanguageSectionProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Language
                </h3>
                <div className="space-y-4">
                    <div>
                        <Label className="text-neutral-900 dark:text-neutral-100 mb-2 block">
                            Display language
                        </Label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className={cn(
                                "w-full rounded-xl",
                                "bg-white/50 dark:bg-neutral-800/30",
                                "border-neutral-200/50 dark:border-neutral-800/50"
                            )}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English (US)</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                                <SelectItem value="de">Deutsch</SelectItem>
                                <SelectItem value="ja">日本語</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Date & Time
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                                Set time zone automatically
                            </Label>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Use your current location to determine time zone
                            </p>
                        </div>
                        <Switch checked={autoTimezone} onCheckedChange={setAutoTimezone} />
                    </div>

                    {!autoTimezone && (
                        <div>
                            <Label className="text-neutral-900 dark:text-neutral-100 mb-2 block">
                                Time zone
                            </Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger className={cn(
                                    "w-full rounded-xl",
                                    "bg-white/50 dark:bg-neutral-800/30",
                                    "border-neutral-200/50 dark:border-neutral-800/50"
                                )}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Automatic</SelectItem>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                    <SelectItem value="Europe/London">London</SelectItem>
                                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
