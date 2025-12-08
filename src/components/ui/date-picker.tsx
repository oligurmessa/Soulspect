"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ============================================================================
// Types
// ============================================================================

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  className?: string
  placeholder?: string
}

// ============================================================================
// Constants
// ============================================================================

const ANIMATION = {
  trigger: { duration: 0.2, ease: "easeInOut" as const },
  popover: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
}

// ============================================================================
// Component
// ============================================================================

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Select date",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    new Date()
  )
  const [month, setMonth] = React.useState<Date>(new Date())

  const date = value || internalDate

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      if (onChange) {
        onChange(selectedDate)
      } else {
        setInternalDate(selectedDate)
      }
      setOpen(false)
    }
  }

  const handlePreviousMonth = () => {
    const newMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1)
    setMonth(newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    setMonth(newMonth)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={ANIMATION.trigger}
          className={cn(
            "inline-flex items-center gap-1.5 sm:gap-2",
            "px-2 py-1.5 sm:px-3.5 sm:py-2.5",
            "rounded-lg sm:rounded-xl",
            "text-xs sm:text-sm font-medium",
            "bg-white/80 dark:bg-neutral-900/80",
            "backdrop-blur-sm",
            "border border-neutral-200/50 dark:border-neutral-800/50",
            "shadow-sm hover:shadow-md",
            "transition-all duration-200",
            "outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600",
            date
              ? "text-neutral-900 dark:text-neutral-100"
              : "text-neutral-500 dark:text-neutral-500",
            "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
            "hover:border-neutral-300 dark:hover:border-neutral-700",
            className
          )}
          aria-label={date ? format(date, "MMMM d, yyyy") : placeholder}
        >
          <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500 dark:text-neutral-400" strokeWidth={2} />
          <span className="text-xs sm:text-sm whitespace-nowrap">
            {date ? (
              <>
                <span className="sm:hidden">{format(date, "MMM d")}</span>
                <span className="hidden sm:inline">{format(date, "MMM d, yyyy")}</span>
              </>
            ) : placeholder}
          </span>
        </motion.button>
      </PopoverTrigger>

      <AnimatePresence>
        {open && (
          <PopoverContent
            className={cn(
              "w-auto p-0",
              "bg-white/80 dark:bg-neutral-900/80",
              "backdrop-blur-xl",
              "border border-neutral-200/50 dark:border-neutral-800/50",
              "shadow-lg",
              "rounded-xl sm:rounded-2xl",
              "overflow-hidden"
            )}
            align="end"
            sideOffset={8}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={ANIMATION.popover}
            >
              {/* Custom Header - Arrows positioned next to month/year */}
              <div className="flex items-center justify-center gap-2 px-3 pt-3 pb-3">
                <button
                  onClick={handlePreviousMonth}
                  className={cn(
                    "h-7 w-7 p-0 flex items-center justify-center",
                    "rounded-md",
                    "text-neutral-500 dark:text-neutral-400",
                    "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                    "hover:text-neutral-900 dark:hover:text-neutral-100",
                    "transition-colors duration-150",
                    "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700"
                  )}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>

                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 min-w-[140px] text-center">
                  {format(month, "MMMM yyyy")}
                </div>

                <button
                  onClick={handleNextMonth}
                  className={cn(
                    "h-7 w-7 p-0 flex items-center justify-center",
                    "rounded-md",
                    "text-neutral-500 dark:text-neutral-400",
                    "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                    "hover:text-neutral-900 dark:hover:text-neutral-100",
                    "transition-colors duration-150",
                    "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700"
                  )}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="px-3 pb-3">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  month={month}
                  onMonthChange={setMonth}
                  showOutsideDays={false}
                  className="p-0 bg-transparent"
                  classNames={{
                    root: "bg-transparent",
                    months: "flex bg-transparent",
                    month: "space-y-3 bg-transparent",
                    month_caption: "hidden",
                    nav: "hidden",
                    button_previous: "hidden",
                    button_next: "hidden",
                    table: "w-full border-collapse bg-transparent",
                    weekdays: "flex bg-transparent",
                    weekday: cn(
                      "w-9 text-xs font-medium",
                      "text-neutral-500 dark:text-neutral-400",
                      "select-none bg-transparent"
                    ),
                    week: "flex w-full mt-1 gap-1 bg-transparent",
                    day: cn(
                      "relative p-0 text-center text-sm w-9 bg-transparent",
                      "focus-within:relative focus-within:z-20"
                    ),
                    today: "bg-transparent",
                    outside: cn(
                      "text-neutral-400 dark:text-neutral-600",
                      "opacity-40 bg-transparent"
                    ),
                    disabled: "text-neutral-300 dark:text-neutral-700 opacity-30 bg-transparent",
                    hidden: "invisible",
                  }}
                  components={{
                    Root: ({ className, rootRef, ...props }) => (
                      <div
                        ref={rootRef}
                        className={cn("bg-transparent", className)}
                        {...props}
                      />
                    ),
                    DayButton: ({ day, modifiers, ...props }) => {
                      const isSelected = modifiers.selected
                      const isToday = modifiers.today
                      const isOutside = modifiers.outside

                      const { onDrag, ...restProps } = props as any;

                      return (
                        <motion.button
                          whileHover={{ scale: isSelected ? 1 : 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "h-9 w-9 p-0",
                            "rounded-md",
                            "text-sm font-medium",
                            "transition-all duration-200",
                            "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700",
                            isSelected && [
                              "bg-neutral-900 dark:bg-neutral-100",
                              "text-white dark:text-neutral-900",
                              "font-semibold",
                              "hover:bg-neutral-800 dark:hover:bg-neutral-200",
                            ],
                            !isSelected && isToday && [
                              "bg-blue-50 dark:bg-blue-900/20",
                              "text-blue-700 dark:text-blue-400",
                              "font-medium",
                              "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                            ],
                            !isSelected && !isToday && [
                              "text-neutral-700 dark:text-neutral-300",
                              "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                              "hover:text-neutral-900 dark:hover:text-neutral-100",
                            ],
                            isOutside && "opacity-40 hover:opacity-60",
                            modifiers.disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
                          )}
                          {...restProps}
                        >
                          {day.date.getDate()}
                        </motion.button>
                      )
                    },
                  }}
                />
              </div>

              {/* Quick Actions Footer */}
              <div className="border-t border-neutral-200/50 dark:border-neutral-800/50 px-3 py-2 flex gap-2">
                <button
                  onClick={() => {
                    const today = new Date()
                    setMonth(today)
                    handleDateSelect(today)
                  }}
                  className={cn(
                    "flex-1 px-3 py-1.5",
                    "text-xs font-medium",
                    "rounded-md",
                    "text-neutral-700 dark:text-neutral-300",
                    "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                    "transition-colors duration-150",
                    "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700"
                  )}
                >
                  Today
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex-1 px-3 py-1.5",
                    "text-xs font-medium",
                    "rounded-md",
                    "text-neutral-700 dark:text-neutral-300",
                    "hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40",
                    "transition-colors duration-150",
                    "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700"
                  )}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>
  )
}

export default DatePicker