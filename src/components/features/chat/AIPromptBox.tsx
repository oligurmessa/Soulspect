import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface PromptInputBoxProps {
  onSend: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
}

export const PromptInputBox: React.FC<PromptInputBoxProps> = ({
  onSend,
  isLoading = false,
  placeholder = "Type a message...",
  className = ""
}) => {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSend(message.trim())
      setMessage("")
    }
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!message.trim() || isLoading}
          size="sm"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}