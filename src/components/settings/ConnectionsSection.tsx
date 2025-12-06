"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ConnectionsSection() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Connected Accounts
                </h3>
                <div className="space-y-4">
                    {/* Google */}
                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl",
                        "bg-neutral-50/50 dark:bg-neutral-800/30",
                        "border border-neutral-200/50 dark:border-neutral-800/50"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                    Google
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Connected
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg">
                            Disconnect
                        </Button>
                    </div>

                    {/* Apple (Mock) */}
                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl",
                        "bg-neutral-50/50 dark:bg-neutral-800/30",
                        "border border-neutral-200/50 dark:border-neutral-800/50"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shadow-sm">
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.69-.71 1.59.25 2.7.93 3.46 1.97-2.9 1.75-2.43 5.89.62 7.15-.6 1.54-1.43 3.04-2.85 3.82zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                    Apple
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Not connected
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg">
                            Connect
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
