"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface SimpleTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SimpleTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing your thoughts...",
  className = "",
  disabled = false 
}: SimpleTextEditorProps) {
  const [internalValue, setInternalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastExternalValue = useRef(value);

  // Auto-resize textarea based on content
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set height to scrollHeight but with minimum height
    const minHeight = 400; // Minimum height in pixels
    const newHeight = Math.max(minHeight, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Sync external value changes to internal state
  useEffect(() => {
    if (value !== lastExternalValue.current) {
      setInternalValue(value);
      lastExternalValue.current = value;
      // Auto-resize after external value change
      setTimeout(autoResize, 0);
    }
  }, [value, autoResize]);

  // Auto-resize on mount and when internal value changes
  useEffect(() => {
    autoResize();
  }, [internalValue, autoResize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    setInternalValue(newValue);
    onChange(newValue);
    
    // Auto-resize as user types
    autoResize();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Handle common keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'a':
          // Ctrl/Cmd+A - Select all (default behavior)
          break;
        case 'z':
          // Ctrl/Cmd+Z - Undo (default behavior)
          break;
        case 'y':
          // Ctrl/Cmd+Y - Redo (default behavior) 
          break;
        case 'Enter':
          // Ctrl/Cmd+Enter - Could be used for save in the future
          e.preventDefault();
          // For now, just insert a line break
          const newValue = internalValue.substring(0, start) + '\n' + internalValue.substring(end);
          setInternalValue(newValue);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }, 0);
          break;
        default:
          break;
      }
      return;
    }

    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (e.shiftKey) {
        // Shift+Tab - Remove indentation
        const lines = internalValue.split('\n');
        const currentLineIndex = internalValue.substring(0, start).split('\n').length - 1;
        
        if (lines[currentLineIndex] && (lines[currentLineIndex].startsWith('\t') || lines[currentLineIndex].startsWith('  '))) {
          if (lines[currentLineIndex].startsWith('\t')) {
            lines[currentLineIndex] = lines[currentLineIndex].substring(1);
          } else if (lines[currentLineIndex].startsWith('  ')) {
            lines[currentLineIndex] = lines[currentLineIndex].substring(2);
          }
          
          const newValue = lines.join('\n');
          setInternalValue(newValue);
          onChange(newValue);
          
          // Adjust cursor position
          const newStart = start - (internalValue.length - newValue.length);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(0, newStart);
          }, 0);
        }
      } else {
        // Tab - Add indentation
        const newValue = internalValue.substring(0, start) + '\t' + internalValue.substring(end);
        setInternalValue(newValue);
        onChange(newValue);

        // Set cursor position after the tab
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      }
      return;
    }

    // Handle Enter key for smart line breaks
    if (e.key === 'Enter') {
      // Get current line to detect indentation
      const beforeCursor = internalValue.substring(0, start);
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine = beforeCursor.substring(currentLineStart);
      
      // Detect leading whitespace/tabs for auto-indentation
      const leadingWhitespace = currentLine.match(/^[\s\t]*/)?.[0] || '';
      
      // Check if current line looks like a list item
      const listItemMatch = currentLine.trim().match(/^[\-\*\+]\s/);
      
      let insertText = '\n' + leadingWhitespace;
      
      // Auto-continue list items
      if (listItemMatch && currentLine.trim().length > listItemMatch[0].length) {
        insertText += listItemMatch[0];
      }
      
      // Insert the new line with proper indentation
      const newValue = internalValue.substring(0, start) + insertText + internalValue.substring(end);
      setInternalValue(newValue);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
      }, 0);
      
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    // Auto-resize when focused in case content changed while unfocused
    setTimeout(autoResize, 0);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Let the default paste behavior work, then auto-resize
    setTimeout(() => {
      autoResize();
    }, 0);
  };

  // Utility function to get word count and character count
  const getStats = () => {
    const wordCount = internalValue.trim() ? internalValue.trim().split(/\s+/).length : 0;
    const charCount = internalValue.length;
    const charCountNoSpaces = internalValue.replace(/\s/g, '').length;
    return { wordCount, charCount, charCountNoSpaces };
  };

  return (
    <div className="h-full w-full">
      <div className="h-full p-3 sm:p-4 lg:p-6 xl:p-8">
        <textarea
          ref={textareaRef}
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full h-full outline-none resize-none bg-transparent 
            text-base sm:text-lg leading-relaxed border-none focus:outline-none
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            placeholder:italic transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:placeholder:opacity-75 selection:bg-sky-300/40 dark:selection:bg-sky-500/30
            pb-40 sm:pb-32 md:pb-28 lg:pb-24
            ${className}
          `}
          style={{ 
            caretColor: '#3B82F6',
            minHeight: '300px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            lineHeight: '1.7',
            tabSize: 4
          }}
          spellCheck={true}
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          wrap="soft"
          data-gramm="true"
        />
      </div>
    </div>
  );
}