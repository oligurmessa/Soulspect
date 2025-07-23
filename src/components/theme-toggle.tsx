"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { IconMoon, IconSun, IconDeviceDesktop } from "@tabler/icons-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <>
      <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
        <IconSun className="h-4 w-4" />
        <span>Light</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
        <IconMoon className="h-4 w-4" />
        <span>Dark</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
        <IconDeviceDesktop className="h-4 w-4" />
        <span>System</span>
      </DropdownMenuItem>
    </>
  )
}