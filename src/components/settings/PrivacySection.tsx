"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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

interface PrivacySectionProps {
    twoFactor: boolean
    setTwoFactor: (value: boolean) => void
    dataCollection: boolean
    setDataCollection: (value: boolean) => void
}

export function PrivacySection({
    twoFactor, setTwoFactor, dataCollection, setDataCollection
}: PrivacySectionProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Security
                </h3>
                <div className="space-y-4">
                    <SettingRow
                        label="Two-factor authentication"
                        description="Add an extra layer of security to your account"
                        checked={twoFactor}
                        onCheckedChange={setTwoFactor}
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Privacy
                </h3>
                <div className="space-y-4">
                    <SettingRow
                        label="Data collection"
                        description="Allow us to collect anonymous usage data to improve the app"
                        checked={dataCollection}
                        onCheckedChange={setDataCollection}
                    />
                </div>
            </div>
        </div>
    )
}
