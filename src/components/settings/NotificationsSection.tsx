"use client"

import { motion } from "framer-motion"
import { Volume2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

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

interface NotificationsSectionProps {
    desktopNotifications: boolean
    setDesktopNotifications: (value: boolean) => void
    emailNotifications: boolean
    setEmailNotifications: (value: boolean) => void
    soundEnabled: boolean
    setSoundEnabled: (value: boolean) => void
    volume: number[]
    setVolume: (value: number[]) => void
}

export function NotificationsSection({
    desktopNotifications, setDesktopNotifications, emailNotifications, setEmailNotifications,
    soundEnabled, setSoundEnabled, volume, setVolume
}: NotificationsSectionProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Notification Settings
                </h3>
                <div className="space-y-4">
                    <SettingRow
                        label="Desktop notifications"
                        description="Show notifications on your desktop"
                        checked={desktopNotifications}
                        onCheckedChange={setDesktopNotifications}
                    />
                    <SettingRow
                        label="Email notifications"
                        description="Receive updates via email"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                    />
                    <SettingRow
                        label="Sound"
                        description="Play sound for notifications"
                        checked={soundEnabled}
                        onCheckedChange={setSoundEnabled}
                    />

                    {soundEnabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Label className="text-neutral-900 dark:text-neutral-100 mb-2 block">
                                Notification volume
                            </Label>
                            <div className="flex items-center gap-4">
                                <Volume2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                <Slider
                                    value={volume}
                                    onValueChange={setVolume}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                />
                                <span className="text-sm text-neutral-600 dark:text-neutral-400 w-10">
                                    {volume}%
                                </span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Notification Types */}
            <div className="pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Notification Types
                </h3>
                <div className="space-y-3">
                    {["Reminders", "Insights", "Weekly summaries", "Goal milestones", "System updates"].map((type) => (
                        <label key={type} className="flex items-center justify-between cursor-pointer py-1">
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">{type}</span>
                            <Switch defaultChecked={type !== "System updates"} />
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}
