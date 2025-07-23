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

// Main navigation with Material Symbols icons
const navMain = [
  { title: "Home", href: "/dashboard", icon: "home" },
  { title: "Log", href: "/dashboard/log", icon: "add" },
  { title: "Journal", href: "/dashboard/journal", icon: "book_2" },
  { title: "Analytics", href: "/dashboard/analytics", icon: "chart_data" },
  { title: "Soulspace", href: "/dashboard/soulspace", icon: "splitscreen_left" },
  { title: "Purpose Compass", href: "/dashboard/compass", icon: "explore" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "sidebar-custom bg-black/30 backdrop-blur-lg border-r border-white/10",
        isCollapsed ? "w-20" : "w-64" // Change collapsed/expanded width here
      )}
    >
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-white/10 p-2">
        <div className="relative flex items-center justify-center w-full">
          {/* Logo + Brand when expanded */}
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-white/10",
              isCollapsed ? "opacity-0 pointer-events-none absolute" : "gap-2 w-full"
            )}
          >
            <img
              src="/logo.png"
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
            <SidebarTrigger className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-white/10 p-0">
              <span className="material-symbols-outlined text-3xl">dashboard</span>
            </SidebarTrigger>
          </div>
          {/* Collapse/Expand Trigger (always right aligned) */}
          <div className={cn(
            "transition-all duration-200 ml-auto",
            !isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none absolute"
          )}>
            <SidebarTrigger className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 p-0">
              <span className="material-symbols-outlined text-2xl">side_navigation</span>
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
                isActive={pathname.startsWith(item.href)}
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
                  <span className="material-symbols-outlined text-2xl flex-shrink-0">{item.icon}</span>
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
          {/* Settings dropdown */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Settings"
                  className="sidebar-menu-button mb-1"
                >
                  <div className={cn(
                    "flex items-center transition-all duration-200 rounded-lg",
                    isCollapsed
                      ? "justify-center w-12 h-12 p-0"
                      : "justify-start gap-3 px-3 py-2 w-full"
                  )}>
                    <span className="material-symbols-outlined text-2xl flex-shrink-0">settings</span>
                    <span className={cn(
                      "transition-all duration-200 overflow-hidden whitespace-nowrap",
                      isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}>
                      Settings
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <ThemeToggle />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          {/* Help link */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Help"
              className="sidebar-menu-button"
            >
              <Link
                href="/help"
                className={cn(
                  "flex items-center transition-all duration-200 rounded-lg",
                  isCollapsed
                    ? "justify-center w-12 h-12 p-0"
                    : "justify-start gap-3 px-3 py-2 w-full"
                )}
              >
                <span className="material-symbols-outlined text-2xl flex-shrink-0">help_center</span>
                <span className={cn(
                  "transition-all duration-200 overflow-hidden whitespace-nowrap",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                  Help
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
