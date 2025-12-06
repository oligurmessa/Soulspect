"use client"

import { Download, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface DataSectionProps {
    autoBackup: boolean
    setAutoBackup: (value: boolean) => void
    handleExportData: (format: 'json' | 'csv') => void
    handleDeleteAllData: () => void
    deleting: boolean
}

export function DataSection({
    autoBackup,
    setAutoBackup,
    handleExportData,
    handleDeleteAllData,
    deleting
}: DataSectionProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Data Management
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                                Automatic backups
                            </Label>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Backup your data daily
                            </p>
                        </div>
                        <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                    </div>

                    <div className="pt-4">
                        <Label className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2 block">
                            Export Data
                        </Label>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                            Download a copy of your data in JSON or CSV format.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => handleExportData('json')}
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export JSON
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleExportData('csv')}
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                </h3>
                <div className={cn(
                    "p-4 rounded-xl",
                    "bg-red-50 dark:bg-red-900/10",
                    "border border-red-200 dark:border-red-900/30"
                )}>
                    <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">
                        Delete all data
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Permanently delete all your journal entries, emotions, and settings. This action cannot be undone.
                    </p>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={deleting}>
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account & Data
                                    </>
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove your data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAllData}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {deleting ? "Deleting..." : "Yes, delete everything"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    )
}
