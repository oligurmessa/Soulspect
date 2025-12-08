"use client"

// =============================================================================
// APP SIDEBAR - Sleek, minimal navigation
// =============================================================================
// A beautifully designed sidebar with:
// - Glass-morphism aesthetic matching the app
// - Smooth collapse/expand animations
// - Professional hover states and transitions
// - Clean visual hierarchy
// - Responsive design
// =============================================================================

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import SettingsModal from "./SettingsModal"

import {
  GalleryHorizontalEnd,
  House,
  Plus,
  LoaderCircle,
  Settings,
  Lock,
  LockOpen,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,

  BadgeCheck,
  CreditCard,
  Bell,
  LogOut,
} from "lucide-react"
import { GeminiSparkle } from "@/components/ui/icons/gemini-sparkle"

// =============================================================================
// Types & Constants
// =============================================================================

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: House },
  { title: "Log", href: "/dashboard/log", icon: Plus },
  { title: "Moments", href: "/dashboard/journal", icon: GalleryHorizontalEnd },
  { title: "Soulspace", href: "/dashboard/soulspace", icon: GeminiSparkle },
]

const ANIMATION = {
  sidebar: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  item: { duration: 0.2, ease: "easeInOut" as const },
}

// =============================================================================
// Component
// =============================================================================

export function AppSidebar() {
  // ---------------------------------------------------------------------------
  // Hooks & State
  // ---------------------------------------------------------------------------
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { user, logout } = useAuth()

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Determines if a nav item is currently active based on the pathname
   */
  const isNavItemActive = (href: string): boolean => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return (
      pathname.startsWith(href) &&
      (pathname.length === href.length || pathname[href.length] === "/")
    )
  }

  /**
   * Handles user sign out
   */
  const handleSignOut = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "bg-sidebar",
        "backdrop-blur-xl",
        "border-r border-sidebar-border",
        "transition-all duration-300"
      )}
    >
      {/* ===================================================================
          HEADER - Logo, brand, and collapse toggle
          =================================================================== */}
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center justify-between gap-2 h-11">
          {/* Logo & Brand - Hidden when collapsed */}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={ANIMATION.sidebar}
                className="flex-1 min-w-0"
              >
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-xl",
                    "hover:bg-sidebar-accent/60",
                    "transition-colors duration-200",
                    "group"
                  )}
                >
                  <div className="relative">
                    <img
                      src="/clean_logo.png"
                      className="h-8 w-8 rounded-xl object-cover transition-all"
                      alt="soulspect"
                    />
                  </div>
                  <span className="text-lg font-semibold text-sidebar-foreground truncate">
                    soulspect
                  </span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse/Expand Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSidebar}
            className={cn(
              "flex items-center justify-center",
              "w-8 h-8 rounded-lg",
              "text-sidebar-foreground/70",
              "hover:bg-sidebar-accent/60",
              "hover:text-sidebar-foreground",
              "transition-all duration-200",
              "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700",
              isCollapsed && "mx-auto"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isCollapsed ? "expand" : "collapse"}
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isCollapsed ? (
                  <ChevronRight size={18} strokeWidth={2} />
                ) : (
                  <ChevronLeft size={18} strokeWidth={2} />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </SidebarHeader >

      {/* ===================================================================
          NAVIGATION - Main menu items
          =================================================================== */}
      < SidebarContent className="p-2" >
        <SidebarMenu className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(item.href)
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={isCollapsed ? item.title : undefined}
                  className={cn(
                    "w-full h-10 rounded-xl transition-all duration-200",
                    "flex items-center justify-start gap-3 pl-3 pr-2", // Added flex items-center
                    "hover:scale-[1.02] active:scale-[0.98]",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Link href={item.href}>
                    <Icon
                      size={20}
                      strokeWidth={2}
                      className="flex-shrink-0"
                    />
                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent >

      {/* ===================================================================
          FOOTER - Settings and lock controls
          =================================================================== */}
      < SidebarFooter className="p-2 mt-auto border-t border-sidebar-border" >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => setSettingsOpen(true)}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground">
                <Settings className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-sidebar-foreground">Settings</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Preferences & Account</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Modals */}
        < SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </SidebarFooter >
    </Sidebar >
  )
}