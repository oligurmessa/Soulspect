"use client"

import { ArrowUp, Paperclip, Loader2, X } from "lucide-react"
import { useState, useRef, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea"
import { motion, AnimatePresence } from "framer-motion"

// =============================================================================
// TYPES
// =============================================================================

interface AttachedFile {
  id: string
  file: File
  preview?: string
}

interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[]) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
  showAttachments?: boolean
  maxFiles?: number
}

// =============================================================================
// COMPONENT
// =============================================================================

export const PromptInputBox = ({
  onSend,
  isLoading = false,
  placeholder = "What's on your mind?",
  className,
  showAttachments = true,
  maxFiles = 4,
}: PromptInputBoxProps) => {
  const [value, setValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 200,
  })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(() => {
    if ((!value.trim() && attachedFiles.length === 0) || isLoading) return

    onSend?.(value, attachedFiles.map(f => f.file))
    setValue("")
    setAttachedFiles([])
    adjustHeight(true)
  }, [value, attachedFiles, isLoading, onSend, adjustHeight])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = maxFiles - attachedFiles.length
    const filesToAdd = files.slice(0, remainingSlots)

    const newAttachments: AttachedFile[] = filesToAdd.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))

    setAttachedFiles(prev => [...prev, ...newAttachments])
    e.target.value = ""
  }

  const removeFile = (id: string) => {
    setAttachedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  const hasContent = value.trim() || attachedFiles.length > 0

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={cn("w-full", className)}>
      {/* Main Container */}
      <div
        className={cn(
          "relative flex flex-col w-full",
          "bg-neutral-100 dark:bg-neutral-800",
          "rounded-2xl overflow-hidden",
          "transition-all duration-200",
          isFocused && "ring-2 ring-neutral-200 dark:ring-neutral-700"
        )}
      >
        {/* Attached Files Preview */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex gap-2 p-3 overflow-x-auto">
                {attachedFiles.map((attachment) => (
                  <motion.div
                    key={attachment.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative flex-shrink-0 group"
                  >
                    {attachment.preview ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                        <img
                          src={attachment.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-neutral-500" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(attachment.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Row */}
        <div className="relative flex items-end">
          {/* Attachment Button */}
          {showAttachments && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || attachedFiles.length >= maxFiles}
                className={cn(
                  "flex-shrink-0 p-2 ml-1 mb-1 rounded-lg transition-colors",
                  "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                  "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={value}
            placeholder={placeholder}
            className={cn(
              "flex-1 bg-transparent border-none focus-visible:ring-0 resize-none",
              "text-neutral-900 dark:text-neutral-100",
              "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
              "min-h-[48px] py-3 px-2",
              "text-[15px] leading-relaxed",
              !showAttachments && "pl-4"
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setValue(e.target.value)
              adjustHeight()
            }}
            disabled={isLoading}
          />

          {/* Send Button */}
          <div className="flex-shrink-0 p-2">
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!hasContent || isLoading}
              whileHover={{ scale: hasContent && !isLoading ? 1.05 : 1 }}
              whileTap={{ scale: hasContent && !isLoading ? 0.95 : 1 }}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                hasContent && !isLoading
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm"
                  : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
              )}
            </motion.button>
          </div>
        </div>

      </div>
    </div>
  )
}
