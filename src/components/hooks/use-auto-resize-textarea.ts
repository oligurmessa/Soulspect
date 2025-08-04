import { useRef, useCallback } from 'react';

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight: number;
  growDirection?: 'up' | 'down';
}

interface UseAutoResizeTextareaReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  adjustHeight: (reset?: boolean) => void;
}

export function useAutoResizeTextarea({
  minHeight,
  maxHeight,
  growDirection = 'down',
}: UseAutoResizeTextareaProps): UseAutoResizeTextareaReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback((reset?: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (reset) {
      textarea.style.height = `${minHeight}px`;
      if (growDirection === 'up') {
        textarea.style.marginTop = '0px';
      }
      return;
    }

    // Store current height for upward growth calculation
    const currentHeight = textarea.offsetHeight;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate the new height
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    
    // For upward growth, adjust margin-top to keep bottom position fixed
    if (growDirection === 'up') {
      const heightDiff = newHeight - currentHeight;
      const currentMarginTop = parseInt(textarea.style.marginTop || '0', 10);
      textarea.style.marginTop = `${currentMarginTop - heightDiff}px`;
    }
    
    // Set the new height
    textarea.style.height = `${newHeight}px`;
  }, [minHeight, maxHeight, growDirection]);

  return {
    textareaRef,
    adjustHeight,
  };
}