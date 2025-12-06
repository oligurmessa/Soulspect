"use client"

import React, { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  FileText,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { GeminiSparkle } from '@/components/ui/icons/gemini-sparkle'

interface NavItem {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  isActive?: boolean
}

interface MobileNavDropdownProps {
  currentPage?: string
  className?: string
}

export function MobileNavDropdown({ currentPage = "log", className }: MobileNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navItems: NavItem[] = [
    {
      id: 'home',
      title: 'Home',
      icon: Home,
      href: '/dashboard',
      isActive: pathname === '/dashboard'
    },
    {
      id: 'log',
      title: 'Log',
      icon: FileText,
      href: '/dashboard/log',
      isActive: pathname.includes('/dashboard/log')
    },
    {
      id: 'moments',
      title: 'Moments',
      icon: Calendar,
      href: '/dashboard/journal',
      isActive: pathname.includes('/dashboard/journal')
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: BarChart3,
      href: '/dashboard/analytics',
      isActive: pathname.includes('/dashboard/analytics')
    },
    {
      id: 'soulspace',
      title: 'Soulspace',
      icon: GeminiSparkle,
      href: '/dashboard/soulspace',
      isActive: pathname.includes('/dashboard/soulspace')
    }
  ]

  const currentNavItem = navItems.find(item => item.isActive) || navItems.find(item => item.id === currentPage)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNavigation = (item: NavItem) => {
    if (!item.isActive) {
      router.push(item.href)
    }
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Mobile Nav Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "lg:hidden flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200",
          "bg-background hover:bg-muted border border-border/50 shadow-sm",
          "text-xs sm:text-sm font-medium text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          isOpen && "bg-muted border-border"
        )}
        aria-label="Navigation menu"
      >
        {currentNavItem && (
          <>
            <currentNavItem.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="max-w-[60px] sm:max-w-[80px] truncate">{currentNavItem.title}</span>
          </>
        )}
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-1.5 sm:mt-2 w-44 sm:w-48 z-50"
          >
            <div className="bg-background/95 backdrop-blur-lg border border-border rounded-xl shadow-lg overflow-hidden">
              <div className="py-1.5 sm:py-2">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    onClick={() => handleNavigation(item)}
                    className={cn(
                      "w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-all duration-200",
                      "hover:bg-muted/50 focus:bg-muted/50 focus:outline-none",
                      item.isActive
                        ? "bg-primary/10 text-primary border-r-2 border-r-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0",
                      item.isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="font-medium text-xs sm:text-sm">{item.title}</span>
                    {item.isActive && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary ml-auto flex-shrink-0" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileNavDropdown