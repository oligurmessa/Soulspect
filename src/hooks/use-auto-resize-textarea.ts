import { useEffect, useRef } from "react"

interface UseAutoResizeTextareaProps {
    minHeight?: number
    maxHeight?: number
}

export function useAutoResizeTextarea({
    minHeight = 52,
    maxHeight = 200,
}: UseAutoResizeTextareaProps = {}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const adjustHeight = (reset?: boolean) => {
        const textarea = textareaRef.current
        if (!textarea) return

        if (reset) {
            textarea.style.height = `${minHeight}px`
            return
        }

        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = "auto"

        const newHeight = Math.min(
            Math.max(textarea.scrollHeight, minHeight),
            maxHeight
        )

        textarea.style.height = `${newHeight}px`
    }

    useEffect(() => {
        // Initial adjustment
        adjustHeight()

        // Add event listener for window resize
        window.addEventListener("resize", () => adjustHeight())

        return () => {
            window.removeEventListener("resize", () => adjustHeight())
        }
    }, [])

    return {
        textareaRef,
        adjustHeight,
    }
}
