"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import {
    Settings, User, Bell, Link2, Palette, Languages,
    Shield, Database, Save, Loader2
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { updateUser, getUser, exportUserData, downloadExportData } from "@/lib/data/legacy/dbHelpers"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Import Modular Components
import { SettingsSidebar } from "@/components/settings/SettingsSidebar"
import { AccountSection } from "@/components/settings/AccountSection"
import { PreferencesSection } from "@/components/settings/PreferencesSection"
import { NotificationsSection } from "@/components/settings/NotificationsSection"
import { AppearanceSection } from "@/components/settings/AppearanceSection"
import { LanguageSection } from "@/components/settings/LanguageSection"
import { PrivacySection } from "@/components/settings/PrivacySection"
import { DataSection } from "@/components/settings/DataSection"
import { ConnectionsSection } from "@/components/settings/ConnectionsSection"

// =============================================================================
// Types & Constants
// =============================================================================

interface SettingSection {
    id: string
    label: string
    icon: React.ReactNode
}

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

const SETTING_SECTIONS: SettingSection[] = [
    { id: "account", label: "Account", icon: <User className="w-4 h-4" /> },
    { id: "preferences", label: "Preferences", icon: <Settings className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "connections", label: "Connections", icon: <Link2 className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
    { id: "language", label: "Language & Time", icon: <Languages className="w-4 h-4" /> },
    { id: "privacy", label: "Privacy & Security", icon: <Shield className="w-4 h-4" /> },
    { id: "data", label: "Data & Storage", icon: <Database className="w-4 h-4" /> },
]

const ANIMATION = {
    section: { duration: 0.2, ease: "easeInOut" as const },
}

// =============================================================================
// Component
// =============================================================================

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    // ---------------------------------------------------------------------------
    // Hooks & State
    // ---------------------------------------------------------------------------
    const { user } = useAuth()
    const { theme, setTheme } = useTheme()
    const [activeSection, setActiveSection] = useState("preferences")
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // User preferences state
    const [language, setLanguage] = useState("en")
    const [timezone, setTimezone] = useState("auto")
    const [startWeekOn, setStartWeekOn] = useState(true)
    const [autoTimezone, setAutoTimezone] = useState(true)
    const [desktopNotifications, setDesktopNotifications] = useState(true)
    const [emailNotifications, setEmailNotifications] = useState(false)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [volume, setVolume] = useState([70])
    const [fontSize, setFontSize] = useState("medium")
    const [reducedMotion, setReducedMotion] = useState(false)
    const [highContrast, setHighContrast] = useState(false)
    const [twoFactor, setTwoFactor] = useState(false)
    const [dataCollection, setDataCollection] = useState(true)
    const [autoBackup, setAutoBackup] = useState(true)
    const [timeFormat24, setTimeFormat24] = useState(false)
    const [compactMode, setCompactMode] = useState(false)
    const [autoSave, setAutoSave] = useState(true)
    const [spellCheck, setSpellCheck] = useState(true)


    // ---------------------------------------------------------------------------
    // Load User Preferences
    // ---------------------------------------------------------------------------
    useEffect(() => {
        const loadPreferences = async () => {
            if (!user) return

            try {
                const userData = await getUser(user.uid)
                if (userData?.preferences) {
                    const prefs = userData.preferences

                    if (prefs.theme) setTheme(prefs.theme)
                    if (prefs.language) setLanguage(prefs.language)
                    if (prefs.timezone) setTimezone(prefs.timezone)
                    if (prefs.startWeekOn !== undefined) setStartWeekOn(prefs.startWeekOn)
                    if (prefs.autoTimezone !== undefined) setAutoTimezone(prefs.autoTimezone)
                    if (prefs.notifications !== undefined) setDesktopNotifications(prefs.notifications)
                    if (prefs.emailNotifications !== undefined) setEmailNotifications(prefs.emailNotifications)
                    if (prefs.soundEnabled !== undefined) setSoundEnabled(prefs.soundEnabled)
                    if (prefs.volume !== undefined) setVolume([prefs.volume])
                    if (prefs.fontSize) setFontSize(prefs.fontSize)
                    if (prefs.reducedMotion !== undefined) setReducedMotion(prefs.reducedMotion)
                    if (prefs.highContrast !== undefined) setHighContrast(prefs.highContrast)
                    if (prefs.twoFactor !== undefined) setTwoFactor(prefs.twoFactor)
                    if (prefs.dataCollection !== undefined) setDataCollection(prefs.dataCollection)
                    if (prefs.autoBackup !== undefined) setAutoBackup(prefs.autoBackup)
                    if (prefs.timeFormat24 !== undefined) setTimeFormat24(prefs.timeFormat24)
                    if (prefs.compactMode !== undefined) setCompactMode(prefs.compactMode)
                    if (prefs.autoSave !== undefined) setAutoSave(prefs.autoSave)
                    if (prefs.spellCheck !== undefined) setSpellCheck(prefs.spellCheck)
                }
            } catch (error) {
                console.error("Error loading preferences:", error)
            }
        }

        loadPreferences()
    }, [user, setTheme])

    // ---------------------------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------------------------

    /**
     * Saves user preferences to Firebase
     */
    const savePreferences = async () => {
        if (!user) return

        setSaving(true)
        try {
            const preferences = {
                theme: theme as 'light' | 'dark' | 'system',
                language,
                timezone: autoTimezone ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone,
                startWeekOn,
                autoTimezone,
                notifications: desktopNotifications,
                emailNotifications,
                soundEnabled,
                volume: volume[0],
                fontSize,
                reducedMotion,
                highContrast,
                twoFactor,
                dataCollection,
                autoBackup,
                timeFormat24,
                compactMode,
                autoSave,
                spellCheck,
            }

            await updateUser(user.uid, { preferences })
            toast.success("Settings saved successfully")
        } catch (error) {
            console.error("Error saving preferences:", error)
            toast.error("Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    /**
     * Exports user data in specified format
     */
    const handleExportData = async (format: 'json' | 'csv') => {
        if (!user) return

        try {
            const data = await exportUserData(user.uid, format)
            const filename = `soulspect-export-${new Date().toISOString().split('T')[0]}.${format}`
            downloadExportData(data, filename, format)
            toast.success("Data exported successfully")
        } catch (error) {
            console.error("Error exporting data:", error)
            toast.error("Failed to export data")
        }
    }

    /**
     * Deletes all user data via server-side API
     */
    const handleDeleteAllData = async () => {
        if (!user) return

        setDeleting(true)
        try {
            const token = await user.getIdToken()

            const response = await fetch('/api/delete-all-data', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || result.details || 'Failed to delete data')
            }

            toast.success("All data deleted successfully")
            onClose()

        } catch (error) {
            console.error("Error deleting user data:", error)
            toast.error(`Failed to delete data: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setDeleting(false)
        }
    }

    // ---------------------------------------------------------------------------
    // Render Section Content
    // ---------------------------------------------------------------------------

    /**
     * Renders content based on active section
     */
    const renderContent = () => {
        const content = (() => {
            switch (activeSection) {
                case "account":
                    return <AccountSection user={user} />

                case "preferences":
                    return (
                        <PreferencesSection
                            startWeekOn={startWeekOn}
                            setStartWeekOn={setStartWeekOn}
                            timeFormat24={timeFormat24}
                            setTimeFormat24={setTimeFormat24}
                            compactMode={compactMode}
                            setCompactMode={setCompactMode}
                            autoSave={autoSave}
                            setAutoSave={setAutoSave}
                            spellCheck={spellCheck}
                            setSpellCheck={setSpellCheck}
                            fontSize={fontSize}
                            setFontSize={setFontSize}
                        />
                    )

                case "notifications":
                    return (
                        <NotificationsSection
                            desktopNotifications={desktopNotifications}
                            setDesktopNotifications={setDesktopNotifications}
                            emailNotifications={emailNotifications}
                            setEmailNotifications={setEmailNotifications}
                            soundEnabled={soundEnabled}
                            setSoundEnabled={setSoundEnabled}
                            volume={volume}
                            setVolume={setVolume}
                        />
                    )

                case "appearance":
                    return (
                        <AppearanceSection
                            reducedMotion={reducedMotion}
                            setReducedMotion={setReducedMotion}
                            highContrast={highContrast}
                            setHighContrast={setHighContrast}
                        />
                    )

                case "language":
                    return (
                        <LanguageSection
                            language={language}
                            setLanguage={setLanguage}
                            timezone={timezone}
                            setTimezone={setTimezone}
                            autoTimezone={autoTimezone}
                            setAutoTimezone={setAutoTimezone}
                        />
                    )

                case "privacy":
                    return (
                        <PrivacySection
                            twoFactor={twoFactor}
                            setTwoFactor={setTwoFactor}
                            dataCollection={dataCollection}
                            setDataCollection={setDataCollection}
                        />
                    )

                case "data":
                    return (
                        <DataSection
                            autoBackup={autoBackup}
                            setAutoBackup={setAutoBackup}
                            handleExportData={handleExportData}
                            handleDeleteAllData={handleDeleteAllData}
                            deleting={deleting}
                        />
                    )

                case "connections":
                    return <ConnectionsSection />

                default:
                    return null
            }
        })()

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={ANIMATION.section}
                >
                    {content}
                </motion.div>
            </AnimatePresence>
        )
    }

    /**
     * Determines if save button should be shown for current section
     */
    const shouldShowSaveButton = () => {
        return ['preferences', 'notifications', 'appearance', 'language', 'privacy', 'data'].includes(activeSection)
    }

    // ---------------------------------------------------------------------------
    // Main Render
    // ---------------------------------------------------------------------------

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(
                "w-[95vw] max-w-5xl h-[90vh] max-h-[800px] p-0",
                "bg-background/95", // Semantic token
                "backdrop-blur-xl",
                "border border-border", // Semantic token
                "flex flex-col md:flex-row overflow-hidden"
            )}>
                {/* Sidebar */}
                <SettingsSidebar
                    sections={SETTING_SECTIONS}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    onClose={onClose}
                />

                {/* Content Area */}
                <div className="flex-1 w-full p-4 md:p-8 overflow-y-auto">
                    {renderContent()}

                    {/* Save Button */}
                    {shouldShowSaveButton() && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50"
                        >
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={savePreferences}
                                disabled={saving}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2",
                                    "px-4 py-3 rounded-xl",
                                    "text-sm font-medium",
                                    "transition-all duration-200",
                                    saving
                                        ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                                        : [
                                            "bg-neutral-900 dark:bg-neutral-100",
                                            "text-white dark:text-neutral-900",
                                            "hover:bg-neutral-800 dark:hover:bg-neutral-200",
                                            "shadow-sm hover:shadow-md",
                                        ]
                                )}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}