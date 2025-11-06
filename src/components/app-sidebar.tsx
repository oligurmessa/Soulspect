"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "./ui/dropdown-menu";
import { useState } from "react";
import SettingsModal from "./SettingsModal";
import LockDialog from "./LockDialog";
import { useLock } from "@/context/LockContext";

// Import lucide-react icons
import {
  GalleryHorizontalEnd, // moments
  House,                // home
  Plus,                 // log
  ChartNoAxesColumn,    // analytics
  LoaderCircle,         // soulspace
  Settings,
  Lock,
  LockOpen,
  Shield,
} from "lucide-react";

// Main navigation with lucide-react icons
const navMain = [
  { title: "Home", href: "/dashboard", icon: House },
  { title: "Log", href: "/dashboard/log", icon: Plus },
  { title: "Moments", href: "/dashboard/journal", icon: GalleryHorizontalEnd },
  { title: "Analytics", href: "/dashboard/analytics", icon: ChartNoAxesColumn },
  { title: "Soulspace", href: "/dashboard/soulspace", icon: LoaderCircle },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const { isLocked, hasPassword, lockFeatureEnabled, lock } = useLock();

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "sidebar-custom bg-background/30 backdrop-blur-lg border-r border-border",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-border p-2">
        <div className="relative flex items-center justify-center w-full">
          {/* Logo + Brand when expanded */}
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-secondary",
              isCollapsed ? "opacity-0 pointer-events-none absolute" : "gap-2 w-full"
            )}
          >
            <img
              src="/clean_logo.png"
              alt="soulspect logo"
              className="h-8 w-8 rounded-full flex-shrink-0"
            />
            <span className="text-lg font-semibold ml-2">soulspect</span>
          </Link>
          {/* Icon button when collapsed */}
          <div className={cn(
            isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none absolute",
            "transition-all duration-200"
          )}>
            <SidebarTrigger className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-secondary p-0">
              <House size={28} />
            </SidebarTrigger>
          </div>
          {/* Collapse/Expand Trigger (always right aligned) */}
          <div className={cn(
            "transition-all duration-200 ml-auto",
            !isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none absolute"
          )}>
            <SidebarTrigger className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary p-0">
              {/* You may want to use a menu or sidebar icon here */}
              <LoaderCircle size={22} />
            </SidebarTrigger>
          </div>
        </div>
      </SidebarHeader>

      {/* Sidebar Navigation Menu */}
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href) &&
                    (pathname.length === item.href.length ||
                      pathname[item.href.length] === '/')
                }
                tooltip={item.title}
                className="sidebar-menu-button mb-1"
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center transition-all duration-200 rounded-lg",
                    isCollapsed
                      ? "justify-center w-12 h-12 p-0"
                      : "justify-start gap-3 px-3 py-2 w-full"
                  )}
                >
                  <item.icon size={22} className="flex-shrink-0" />
                  <span className={cn(
                    "transition-all duration-200 overflow-hidden whitespace-nowrap",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}>
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar Footer with Settings and Help */}
      <SidebarFooter className="p-2 mt-auto">
        <SidebarMenu>
          {/* Settings button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setSettingsOpen(true)}
              tooltip="Settings"
              className="sidebar-menu-button mb-1"
            >
              <div className={cn(
                "flex items-center transition-all duration-200 rounded-lg",
                isCollapsed
                  ? "justify-center w-12 h-12 p-0"
                  : "justify-start gap-3 px-3 py-2 w-full"
              )}>
                <Settings size={22} className="flex-shrink-0" />
                <span className={cn(
                  "transition-all duration-200 overflow-hidden whitespace-nowrap",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                  Settings
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Lock/Unlock button - only show if lock feature is enabled */}
          {lockFeatureEnabled && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  if (hasPassword) {
                    if (isLocked) {
                      setLockDialogOpen(true);
                    } else {
                      lock();
                    }
                  } else {
                    setLockDialogOpen(true);
                  }
                }}
                tooltip={hasPassword ? (isLocked ? "Unlock App" : "Lock App") : "Set Password"}
                className="sidebar-menu-button"
              >
                <div className={cn(
                  "flex items-center transition-all duration-200 rounded-lg",
                  isCollapsed
                    ? "justify-center w-12 h-12 p-0"
                    : "justify-start gap-3 px-3 py-2 w-full"
                )}>
                  {hasPassword ? (
                    isLocked ? (
                      <Lock size={22} className="flex-shrink-0" />
                    ) : (
                      <LockOpen size={22} className="flex-shrink-0" />
                    )
                  ) : (
                    <Shield size={22} className="flex-shrink-0" />
                  )}
                  <span className={cn(
                    "transition-all duration-200 overflow-hidden whitespace-nowrap",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}>
                    {hasPassword ? (isLocked ? "Unlock" : "Lock") : "Set Password"}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      
      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {/* Lock Dialog - only render if lock feature is enabled */}
      {lockFeatureEnabled && (
        <LockDialog
          open={lockDialogOpen}
          onOpenChange={setLockDialogOpen}
          mode={hasPassword ? "verify" : "set"}
        />
      )}
    </Sidebar>
  );
}
