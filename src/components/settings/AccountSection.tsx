"use client"

import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AccountSectionProps {
    user: any
}

export function AccountSection({ user }: AccountSectionProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Account Information
                </h3>
                <div className="space-y-4">
                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl",
                        "bg-neutral-50/50 dark:bg-neutral-800/30",
                        "border border-neutral-200/50 dark:border-neutral-800/50"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
                                ) : (
                                    <User className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {user?.displayName || "User"}
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg">
                            Edit Profile
                        </Button>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Subscription
                </h3>
                <div className={cn(
                    "p-4 rounded-xl",
                    "bg-gradient-to-r from-neutral-50/50 to-neutral-100/50",
                    "dark:from-neutral-800/30 dark:to-neutral-800/20",
                    "border border-neutral-200/50 dark:border-neutral-800/50"
                )}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            Free Plan
                        </span>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            $0/month
                        </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        Pro not available yet
                    </p>
                    <Button className="w-full rounded-lg" variant="outline" disabled>
                        Pro Coming Soon
                    </Button>
                </div>
            </div>
        </div>
    )
}
