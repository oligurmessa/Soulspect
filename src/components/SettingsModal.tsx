"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
    Settings, User, Bell, Link2, Palette, Languages, 
    Monitor, Smartphone, Moon, Sun, Volume2, Mail,
    Shield, Key, Globe, Clock, Calendar, MapPin,
    Zap, Database, Download, Upload, HelpCircle,
    ChevronRight, Check, X, Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateUser, getUser, exportUserData, downloadExportData } from "@/lib/dbHelpers";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface SettingSection {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const settingSections: SettingSection[] = [
    { id: "account", label: "Account", icon: <User className="w-4 h-4" /> },
    { id: "preferences", label: "Preferences", icon: <Settings className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "connections", label: "Connections", icon: <Link2 className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
    { id: "language", label: "Language & Time", icon: <Languages className="w-4 h-4" /> },
    { id: "privacy", label: "Privacy & Security", icon: <Shield className="w-4 h-4" /> },
    { id: "data", label: "Data & Storage", icon: <Database className="w-4 h-4" /> },
    { id: "help", label: "Help & Support", icon: <HelpCircle className="w-4 h-4" /> },
];

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [activeSection, setActiveSection] = useState("preferences");
    const [saving, setSaving] = useState(false);
    
    // User preferences state
    const [language, setLanguage] = useState("en");
    const [timezone, setTimezone] = useState("auto");
    const [startWeekOn, setStartWeekOn] = useState(true);
    const [autoTimezone, setAutoTimezone] = useState(true);
    const [desktopNotifications, setDesktopNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [volume, setVolume] = useState([70]);
    const [fontSize, setFontSize] = useState("medium");
    const [reducedMotion, setReducedMotion] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);
    const [dataCollection, setDataCollection] = useState(true);
    const [autoBackup, setAutoBackup] = useState(true);
    const [timeFormat24, setTimeFormat24] = useState(false);
    const [compactMode, setCompactMode] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    const [spellCheck, setSpellCheck] = useState(true);
    const [lockFeatureEnabled, setLockFeatureEnabled] = useState(false);

    // Load user preferences
    useEffect(() => {
        const loadPreferences = async () => {
            if (!user) return;
            
            try {
                const userData = await getUser(user.uid);
                if (userData?.preferences) {
                    const prefs = userData.preferences;
                    
                    // Apply loaded preferences
                    if (prefs.theme) setTheme(prefs.theme);
                    if (prefs.language) setLanguage(prefs.language);
                    if (prefs.timezone) setTimezone(prefs.timezone);
                    if (prefs.startWeekOn !== undefined) setStartWeekOn(prefs.startWeekOn);
                    if (prefs.autoTimezone !== undefined) setAutoTimezone(prefs.autoTimezone);
                    if (prefs.notifications !== undefined) setDesktopNotifications(prefs.notifications);
                    if (prefs.emailNotifications !== undefined) setEmailNotifications(prefs.emailNotifications);
                    if (prefs.soundEnabled !== undefined) setSoundEnabled(prefs.soundEnabled);
                    if (prefs.volume !== undefined) setVolume([prefs.volume]);
                    if (prefs.fontSize) setFontSize(prefs.fontSize);
                    if (prefs.reducedMotion !== undefined) setReducedMotion(prefs.reducedMotion);
                    if (prefs.highContrast !== undefined) setHighContrast(prefs.highContrast);
                    if (prefs.twoFactor !== undefined) setTwoFactor(prefs.twoFactor);
                    if (prefs.dataCollection !== undefined) setDataCollection(prefs.dataCollection);
                    if (prefs.autoBackup !== undefined) setAutoBackup(prefs.autoBackup);
                    if (prefs.timeFormat24 !== undefined) setTimeFormat24(prefs.timeFormat24);
                    if (prefs.compactMode !== undefined) setCompactMode(prefs.compactMode);
                    if (prefs.autoSave !== undefined) setAutoSave(prefs.autoSave);
                    if (prefs.spellCheck !== undefined) setSpellCheck(prefs.spellCheck);
                    if (prefs.lockFeatureEnabled !== undefined) setLockFeatureEnabled(prefs.lockFeatureEnabled);
                }
            } catch (error) {
                console.error("Error loading preferences:", error);
            }
        };
        
        loadPreferences();
    }, [user, setTheme]);

    // Save preferences to Firebase
    const savePreferences = async () => {
        if (!user) return;
        
        setSaving(true);
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
                lockFeatureEnabled,
            };
            
            await updateUser(user.uid, { preferences });
            toast.success("Settings saved successfully");
        } catch (error) {
            console.error("Error saving preferences:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // Export user data
    const handleExportData = async (format: 'json' | 'csv') => {
        if (!user) return;
        
        try {
            const data = await exportUserData(user.uid, format);
            const filename = `soulspect-export-${new Date().toISOString().split('T')[0]}.${format}`;
            downloadExportData(data, filename, format);
            toast.success("Data exported successfully");
        } catch (error) {
            console.error("Error exporting data:", error);
            toast.error("Failed to export data");
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case "account":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Account Information</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                            {user?.photoURL ? (
                                                <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
                                            ) : (
                                                <User className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-white">{user?.displayName || "User"}</p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Edit Profile</Button>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-white">Email Address</p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{user?.email}</p>
                                        </div>
                                        <Button variant="ghost" size="sm">Change</Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-white">Password</p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Last changed 0 months ago</p>
                                        </div>
                                        <Button variant="ghost" size="sm">Update</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Subscription</h3>
                            <div className="p-4 rounded-lg bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-800/30">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {/* <Sparkles className="w-5 h-5 text-zinc-900 dark:text-white" /> */}
                                        <span className="font-medium text-zinc-900 dark:text-white">Free Plan</span>
                                    </div>
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">$0/month</span>
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Pro not available yet</p>
                                <Button className="w-full" variant="outline">Pro Coming Soon</Button>
                            </div>
                        </div>
                    </div>
                );

            case "preferences":
                return (
                    <div className="space-y-6">
                        
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">General Preferences</h3>
                            <div className="space-y-4">

                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Theme</h3>
                            <RadioGroup value={theme} onValueChange={setTheme}>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
                                        { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
                                        { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> }
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className={`relative flex flex-col items-center gap-2 p-4 cursor-pointer rounded-xl border-2 transition-all
                                                ${theme === option.value
                                                    ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50"
                                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                                }`}
                                        >
                                            <RadioGroupItem value={option.value} className="sr-only" />
                                            {option.icon}
                                            <span className="text-sm font-medium">{option.label}</span>
                                            {theme === option.value && (
                                                <div className="absolute -top-2 -right-2">
                                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 dark:bg-white">
                                                        <Check className="h-3 w-3 text-white dark:text-zinc-900" />
                                                    </span>
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Start week on Monday</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">This will change how all calendars in your app look.</p>
                                    </div>
                                    <Switch checked={startWeekOn} onCheckedChange={setStartWeekOn} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">24-hour time format</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Display time in 24-hour format instead of AM/PM</p>
                                    </div>
                                    <Switch checked={timeFormat24} onCheckedChange={setTimeFormat24} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Compact mode</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Reduce spacing between elements for more content</p>
                                    </div>
                                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Editor Preferences</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Auto-save</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Automatically save changes as you type</p>
                                    </div>
                                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Spell check</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Check spelling as you type</p>
                                    </div>
                                    <Switch checked={spellCheck} onCheckedChange={setSpellCheck} />
                                </div>
                                
                                <div>
                                    <Label className="text-zinc-900 dark:text-white mb-2">Default font size</Label>
                                    <Select value={fontSize} onValueChange={setFontSize}>
                                        <SelectTrigger className="w-full">
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
                );

            case "notifications":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Notification Settings</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Desktop notifications</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Show notifications on your desktop</p>
                                    </div>
                                    <Switch checked={desktopNotifications} onCheckedChange={setDesktopNotifications} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Email notifications</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Receive updates via email</p>
                                    </div>
                                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Sound</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Play sound for notifications</p>
                                    </div>
                                    <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                                </div>
                                
                                {soundEnabled && (
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white mb-2">Notification volume</Label>
                                        <div className="flex items-center gap-4">
                                            <Volume2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                                            <Slider 
                                                value={volume} 
                                                onValueChange={setVolume}
                                                max={100}
                                                step={1}
                                                className="flex-1"
                                            />
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400 w-10">{volume}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Notification Types</h3>
                            <div className="space-y-3">
                                {["Reminders", "Insights", "Weekly summaries", "Goal milestones", "System updates"].map((type) => (
                                    <label key={type} className="flex items-center justify-between cursor-pointer">
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{type}</span>
                                        <Switch defaultChecked={type !== "System updates"} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "appearance":
                return (
                    <div className="space-y-6">

                        
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Accessibility</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Reduce motion</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Minimize animations throughout the app</p>
                                    </div>
                                    <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">High contrast</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Increase contrast for better visibility</p>
                                    </div>
                                    <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "language":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Language</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-zinc-900 dark:text-white mb-2">Display language</Label>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English (US)</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                            <SelectItem value="fr">Français</SelectItem>
                                            <SelectItem value="de">Deutsch</SelectItem>
                                            <SelectItem value="ja">日本語</SelectItem>
                                            <SelectItem value="zh">中文</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Change the language used in the user interface.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Time Zone</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Set timezone automatically</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Use your location to set timezone</p>
                                    </div>
                                    <Switch checked={autoTimezone} onCheckedChange={setAutoTimezone} />
                                </div>
                                
                                {!autoTimezone && (
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white mb-2">Timezone</Label>
                                        <Select value={timezone} onValueChange={setTimezone}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                                                <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                                                <SelectItem value="CST">Central Time (CST)</SelectItem>
                                                <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                                                <SelectItem value="CET">Central European Time (CET)</SelectItem>
                                                <SelectItem value="JST">Japan Standard Time (JST)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                
                                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Current timezone: <span className="font-medium text-zinc-900 dark:text-white">
                                            {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "privacy":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Security</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">App lock feature</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Enable app lock to secure your data with a password. When disabled, the lock option will be removed from the sidebar.</p>
                                    </div>
                                    <Switch checked={lockFeatureEnabled} onCheckedChange={setLockFeatureEnabled} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Two-factor authentication</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Add an extra layer of security to your account</p>
                                    </div>
                                    <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                                </div>
                                
                                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex items-start gap-3">
                                        <Key className="w-5 h-5 text-zinc-600 dark:text-zinc-400 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium text-zinc-900 dark:text-white mb-1">Active sessions</p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">You're currently signed in on 1 device</p>
                                            <Button size="sm" variant="outline">Manage Sessions</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Privacy</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Analytics & data collection</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Help improve the app by sharing usage data</p>
                                    </div>
                                    <Switch checked={dataCollection} onCheckedChange={setDataCollection} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Marketing emails</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Receive updates about new features and tips</p>
                                    </div>
                                    <Switch />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "data":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Storage</h3>
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-medium text-zinc-900 dark:text-white">Storage used</span>
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">-- GB of 5 GB</span>
                                    </div>
                                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                                        <div className="bg-zinc-900 dark:bg-white h-2 rounded-full" style={{ width: '0%' }}></div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-zinc-900 dark:text-white">Auto-backup</Label>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Automatically backup your data daily</p>
                                    </div>
                                    <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Data Management</h3>
                            <div className="space-y-3">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-between"
                                    onClick={() => handleExportData('json')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        <span>Export your data (JSON)</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-between"
                                    onClick={() => handleExportData('csv')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        <span>Export your data (CSV)</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                
                                <Button variant="outline" className="w-full justify-between text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                                    <span>Delete all data</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );

            case "connections":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Connected Apps</h3>
                            <div className="space-y-3">
                                {[
                                    { name: "Google Calendar", connected: false, icon: <Calendar className="w-5 h-5" /> },
                                    { name: "Apple Health", connected: false, icon: <Smartphone className="w-5 h-5" /> },
                                    { name: "Spotify", connected: false, icon: <Globe className="w-5 h-5" /> },
                                    { name: "Notion", connected: false, icon: <Database className="w-5 h-5" /> }
                                ].map((app) => (
                                    <div key={app.name} className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                                {app.icon}
                                            </div>
                                            <div>
                                                <p className="font-medium text-zinc-900 dark:text-white">{app.name}</p>
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {app.connected ? "Connected" : "Not connected"}
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant={app.connected ? "ghost" : "outline"}
                                            className={app.connected ? "text-red-600 hover:text-red-700" : ""}
                                            disabled
                                        >
                                            {app.connected ? "Disconnect" : "Coming Soon"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "help":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Help & Support</h3>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-between">
                                    <span>Release Notes</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                
                                <Button variant="outline" className="w-full justify-between">
                                    <span>Contact Support</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>

                                <Button variant="outline" className="w-full justify-between">
                                    <span>System Status</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>

                                <Button variant="outline" className="w-full justify-between">
                                    <span>Keyboard Shortcuts</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">About</h3>
                            <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <p>Soulspect Version 1.0.0</p>
                                <p>© 2025 Soulspect. All rights reserved.</p>
                                <div className="flex gap-4 pt-2">
                                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Terms</a>
                                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Privacy</a>
                                    <a href="#" className="hover:text-zinc-900 dark:hover:text-white">Licenses</a>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1150px] w-[1150px] h-[715px] p-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-[240px] bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-4">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Settings
                        </DialogTitle>
                    </DialogHeader>
                    
                    <nav className="space-y-1">
                        {settingSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                                    ${activeSection === section.id
                                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                                    }`}
                            >
                                {section.icon}
                                {section.label}
                            </button>
                        ))}
                    </nav>
                    
                    <div className="absolute bottom-4 left-4 right-4 w-[208px]">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Close Settings
                        </Button>
                    </div>
                </div>
                
                {/* Content Area */}
                <div className="flex-1 w-[910px] p-8 overflow-y-auto">
                    {renderContent()}
                    
                    {/* Save Button */}
                    {['preferences', 'notifications', 'appearance', 'language', 'privacy', 'data'].includes(activeSection) && (
                        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                            <Button 
                                onClick={savePreferences}
                                disabled={saving}
                                className="w-full"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}