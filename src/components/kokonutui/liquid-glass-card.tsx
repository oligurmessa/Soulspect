"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LiquidGlassCardProps {
  children: React.ReactNode
  variant?: "primary" | "secondary"
  hover?: "glow" | "none"
  glassEffect?: boolean
  size?: "default" | "sm" | "lg" | "custom"
  className?: string
}

export function LiquidGlassCard({
  children,
  variant = "primary",
  hover = "none",
  glassEffect = true,
  size = "default",
  className,
}: LiquidGlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 backdrop-blur-sm transition-all duration-300",
        {
          "bg-background/50": glassEffect,
          "bg-background": !glassEffect,
          "hover:shadow-lg hover:shadow-primary/10": hover === "glow",
          "p-4": size === "default",
          "p-2": size === "sm",
          "p-6": size === "lg",
        },
        className
      )}
    >
      {children}
    </div>
  )
}

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  children: React.ReactNode
}

export function LiquidButton({
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: LiquidButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
          "border border-input hover:bg-accent hover:text-accent-foreground": variant === "outline",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "h-10 py-2 px-4": size === "default",
          "h-9 px-3 rounded-md": size === "sm",
          "h-11 px-8 rounded-md": size === "lg",
          "h-10 w-10": size === "icon",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface CardHeaderProps {
  title: string
  onTitleChange?: (title: string) => void
  isEditable?: boolean
  date?: string
  className?: string
}

export function CardHeader({
  title,
  onTitleChange,
  isEditable = false,
  date,
  className,
}: CardHeaderProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(title)

  const handleTitleSubmit = () => {
    if (onTitleChange) {
      onTitleChange(editTitle)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit()
    } else if (e.key === "Escape") {
      setEditTitle(title)
      setIsEditing(false)
    }
  }

  return (
    <div className={cn("space-y-1", className)}>
      {isEditable && isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleTitleSubmit}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-sm font-medium w-full"
          autoFocus
        />
      ) : (
        <h3
          className={cn(
            "text-sm font-medium",
            isEditable && "cursor-pointer hover:text-foreground/80"
          )}
          onClick={() => isEditable && setIsEditing(true)}
        >
          {title}
        </h3>
      )}
      {date && (
        <p className="text-xs text-muted-foreground">{date}</p>
      )}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("", className)}>{children}</div>
}