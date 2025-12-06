"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ReflectionBlock,
  ReflectionSuggestion,
  ReflectionPriority,
  ReflectionState,
} from "@/components/ReflectionBlock";
import { ChevronsDown } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface TextBlock {
  id: string;
  type: "text";
  content: string;
}

interface ReflectionBlockData {
  id: string;
  type: "reflection";
  reflectionId: string;
}

type Block = TextBlock | ReflectionBlockData;

interface ReflectionMeta {
  status: ReflectionState;
  isCollapsed: boolean;
  suggestion: ReflectionSuggestion | null;
}

interface BlockEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  generateReflection?: (context: string) => Promise<ReflectionSuggestion>;
  onReflectionStateChange?: (hasReflections: boolean, areAllCollapsed: boolean) => void;
  editorRef?: React.MutableRefObject<{
    addReflection: () => void;
    toggleCollapseAll: () => void;
  } | null>;
}

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createTextBlock(content: string = ""): TextBlock {
  return { id: generateId(), type: "text", content };
}

function createReflectionBlock(): ReflectionBlockData {
  return { id: generateId(), type: "reflection", reflectionId: generateId() };
}

/**
 * Default reflection generator - uses a simple heuristic approach
 */
async function defaultGenerateReflection(context: string): Promise<ReflectionSuggestion> {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

  const trimmed = context.trim().toLowerCase();

  let priority: ReflectionPriority = "low";
  let title = "A moment to reflect";
  let description = "Take a moment to explore what you've written. What patterns do you notice?";

  // Emotional keywords detection
  const emotionalKeywords = [
    'anxious', 'worried', 'stressed', 'overwhelmed', 'scared', 'afraid',
    'sad', 'lonely', 'depressed', 'hurt', 'angry', 'frustrated'
  ];

  const positiveKeywords = [
    'happy', 'grateful', 'excited', 'proud', 'accomplished', 'peaceful',
    'content', 'joyful', 'hopeful', 'confident'
  ];

  const hasEmotionalContent = emotionalKeywords.some(keyword => trimmed.includes(keyword));
  const hasPositiveContent = positiveKeywords.some(keyword => trimmed.includes(keyword));

  if (hasEmotionalContent) {
    priority = "high";
    title = "You're processing something important";
    description = "Your words suggest you're working through challenging emotions. What would it feel like to approach these feelings with compassion rather than judgment?";
  } else if (hasPositiveContent) {
    priority = "medium";
    title = "Celebrating your experience";
    description = "You're noticing positive moments in your life. How might you anchor this feeling to carry it forward into future challenges?";
  } else if (context.length > 500) {
    priority = "medium";
    title = "You have a lot on your mind";
    description = "You've shared quite a bit here. If you had to summarize the core theme in one sentence, what would it be?";
  } else if (context.includes("?")) {
    priority = "medium";
    title = "Exploring your questions";
    description = "Questions often point to what matters most. What answer would bring you the most peace or clarity right now?";
  }

  return {
    id: generateId(),
    title,
    description,
    priority,
  };
}

/**
 * Determines if Enter should trigger a reflection
 */
function shouldInsertReflection(
  content: string,
  cursorPos: number,
  hasTextBefore: boolean
): boolean {
  if (!hasTextBefore) return false;

  // Find current line boundaries
  const prevNewline = content.lastIndexOf("\n", cursorPos - 1);
  const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;

  const nextNewline = content.indexOf("\n", cursorPos);
  const lineEnd = nextNewline === -1 ? content.length : nextNewline;

  const currentLine = content.slice(lineStart, lineEnd);
  return currentLine.trim().length === 0;
}

// ============================================================================
// Main Component
// ============================================================================

export function BlockEditor({
  value = "",
  onChange,
  placeholder = "Start writing your thoughts... Press Enter twice to add an AI reflection.",
  className = "",
  disabled = false,
  generateReflection = defaultGenerateReflection,
  onReflectionStateChange,
  editorRef,
}: BlockEditorProps) {
  // Core state
  const [blocks, setBlocks] = useState<Block[]>(() => {
    // Initialize with value if provided
    if (value) {
      return [createTextBlock(value)];
    }
    return [createTextBlock()];
  });
  const [reflections, setReflections] = useState<Record<string, ReflectionMeta>>({});

  // Focus management
  const pendingFocus = useRef<{ blockId: string; cursorPos: number } | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Track if we should sync to external value
  const isInternalChange = useRef(false);

  // Derived state
  const reflectionValues = Object.values(reflections);
  const hasReflections = reflectionValues.length > 0;
  const areAllCollapsed = hasReflections && reflectionValues.every((r) => r.isCollapsed);

  // Notify parent of state changes
  useEffect(() => {
    if (onReflectionStateChange) {
      onReflectionStateChange(hasReflections, areAllCollapsed);
    }
  }, [hasReflections, areAllCollapsed, onReflectionStateChange]);

  // Sync external value changes
  useEffect(() => {
    if (!isInternalChange.current && value !== undefined) {
      const currentContent = blocks
        .filter((b): b is TextBlock => b.type === "text")
        .map((b) => b.content)
        .join("");

      if (currentContent !== value) {
        // Reset to single block with new value
        setBlocks([createTextBlock(value)]);
        setReflections({});
      }
    }
    isInternalChange.current = false;
  }, [value]);

  // Apply pending focus after render
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;

    const textarea = textareaRefs.current[pending.blockId];
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(pending.cursorPos, pending.cursorPos);
      pendingFocus.current = null;
    }
  });

  // -------------------------------------------------------------------------
  // Textarea auto-resize
  // -------------------------------------------------------------------------

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Resize all textareas when blocks change
  useEffect(() => {
    Object.values(textareaRefs.current).forEach((el) => {
      if (el) autoResize(el);
    });
  }, [blocks, autoResize]);

  // -------------------------------------------------------------------------
  // Block operations
  // -------------------------------------------------------------------------

  const updateTextBlock = (blockId: string, content: string) => {
    isInternalChange.current = true;
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId && b.type === "text" ? { ...b, content } : b))
    );

    // Notify parent of content change
    if (onChange) {
      const allContent = blocks
        .map((b) => {
          if (b.id === blockId && b.type === "text") return content;
          if (b.type === "text") return b.content;
          return "";
        })
        .filter(Boolean)
        .join("");
      onChange(allContent);
    }
  };

  const insertReflection = (blockIndex: number, cursorPos: number) => {
    const block = blocks[blockIndex];
    if (block.type !== "text") return;

    const textBefore = block.content.slice(0, cursorPos);
    const textAfter = block.content.slice(cursorPos);

    const beforeBlock: TextBlock = { ...block, content: textBefore };
    const reflectionBlock = createReflectionBlock();
    const afterBlock = createTextBlock(textAfter);

    // Update blocks
    isInternalChange.current = true;
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(blockIndex, 1, beforeBlock, reflectionBlock, afterBlock);
      return next;
    });

    // Initialize reflection state
    setReflections((prev) => ({
      ...prev,
      [reflectionBlock.reflectionId]: {
        status: "loading",
        isCollapsed: false,
        suggestion: null,
      },
    }));

    // Focus the after block at start
    pendingFocus.current = { blockId: afterBlock.id, cursorPos: 0 };

    // Generate suggestion
    performGenerateReflection(reflectionBlock.reflectionId, blockIndex);
  };

  const removeReflection = (reflectionId: string) => {
    const reflectionIndex = blocks.findIndex(
      (b) => b.type === "reflection" && b.reflectionId === reflectionId
    );
    if (reflectionIndex === -1) return;

    const prevBlock = blocks[reflectionIndex - 1];
    const nextBlock = blocks[reflectionIndex + 1];

    // Invariant: reflection blocks are always between text blocks
    if (prevBlock?.type !== "text" || nextBlock?.type !== "text") {
      console.error("Invariant violation: reflection not between text blocks");
      return;
    }

    const mergePoint = prevBlock.content.length;
    const mergedBlock: TextBlock = {
      ...prevBlock,
      content: prevBlock.content + nextBlock.content,
    };

    isInternalChange.current = true;
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(reflectionIndex - 1, 3, mergedBlock);
      return next;
    });

    // Clean up reflection state
    setReflections((prev) => {
      const next = { ...prev };
      delete next[reflectionId];
      return next;
    });

    // Focus at merge point
    pendingFocus.current = { blockId: mergedBlock.id, cursorPos: mergePoint };

    // Notify parent of content change
    if (onChange) {
      const allContent = blocks
        .filter((b): b is TextBlock => b.type === "text")
        .map((b) => b.content)
        .join("");
      onChange(allContent);
    }
  };

  const performGenerateReflection = async (reflectionId: string, contextUpToIndex: number) => {
    // Build context from all text blocks up to and including the split point
    const context = blocks
      .slice(0, contextUpToIndex + 1)
      .filter((b): b is TextBlock => b.type === "text")
      .map((b) => b.content)
      .join("");

    try {
      const suggestion = await generateReflection(context);

      setReflections((prev) => ({
        ...prev,
        [reflectionId]: {
          ...prev[reflectionId],
          status: "ready",
          suggestion,
        },
      }));
    } catch (error) {
      console.error("Failed to generate reflection:", error);
      setReflections((prev) => ({
        ...prev,
        [reflectionId]: {
          ...prev[reflectionId],
          status: "ready",
          suggestion: {
            id: generateId(),
            title: "Unable to generate reflection",
            description: "Something went wrong. Please try again.",
            priority: "low",
          },
        },
      }));
    }
  };

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, blockIndex: number) => {
    if (e.key !== "Enter" || e.shiftKey) return;

    const block = blocks[blockIndex];
    if (block.type !== "text") return;

    const cursorPos = e.currentTarget.selectionStart;

    // Check if there's meaningful text before this position
    let hasTextBefore = false;
    for (let i = 0; i < blockIndex; i++) {
      const b = blocks[i];
      if (b.type === "text" && b.content.trim()) {
        hasTextBefore = true;
        break;
      }
    }
    if (!hasTextBefore) {
      const textBeforeCursor = block.content.slice(0, cursorPos);
      hasTextBefore = textBeforeCursor.trim().length > 0;
    }

    if (shouldInsertReflection(block.content, cursorPos, hasTextBefore)) {
      e.preventDefault();
      insertReflection(blockIndex, cursorPos);
    }
  };

  const handleReflectButton = () => {
    // Find last text block with content
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i];
      if (block.type === "text" && block.content.trim()) {
        insertReflection(i, block.content.length);
        return;
      }
    }
  };

  const handleAccept = (reflectionId: string) => {
    setReflections((prev) => ({
      ...prev,
      [reflectionId]: { ...prev[reflectionId], status: "accepted", isCollapsed: true },
    }));
  };

  const handleRetry = (reflectionId: string) => {
    const reflectionIndex = blocks.findIndex(
      (b) => b.type === "reflection" && b.reflectionId === reflectionId
    );
    if (reflectionIndex === -1) return;

    setReflections((prev) => ({
      ...prev,
      [reflectionId]: { ...prev[reflectionId], status: "loading", suggestion: null },
    }));

    performGenerateReflection(reflectionId, reflectionIndex - 1);
  };

  const handleToggleCollapse = (reflectionId: string) => {
    setReflections((prev) => ({
      ...prev,
      [reflectionId]: { ...prev[reflectionId], isCollapsed: !prev[reflectionId]?.isCollapsed },
    }));
  };

  const handleCollapseAll = () => {
    setReflections((prev) => {
      const next: Record<string, ReflectionMeta> = {};
      for (const [id, meta] of Object.entries(prev)) {
        next[id] = { ...meta, isCollapsed: true };
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setReflections((prev) => {
      const next: Record<string, ReflectionMeta> = {};
      for (const [id, meta] of Object.entries(prev)) {
        next[id] = { ...meta, isCollapsed: false };
      }
      return next;
    });
  };

  const handleToggleCollapseAll = () => {
    if (areAllCollapsed) {
      handleExpandAll();
    } else {
      handleCollapseAll();
    }
  };

  const handleEditorClick = () => {
    // Focus the last text block
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i];
      if (block.type === "text") {
        pendingFocus.current = { blockId: block.id, cursorPos: block.content.length };
        // Force a re-render to trigger the focus effect
        setBlocks((prev) => [...prev]);
        return;
      }
    }
  };

  // Expose methods through ref
  useEffect(() => {
    if (editorRef) {
      editorRef.current = {
        addReflection: handleReflectButton,
        toggleCollapseAll: handleToggleCollapseAll,
      };
    }
  }, [editorRef, handleReflectButton, handleToggleCollapseAll]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const hasContent = blocks.some((b) => b.type === "text" && b.content.trim());

  return (
    <div className={cn("relative", className)}>
      {/* Editor */}
      <div className="p-4 pb-32">
        {blocks.map((block, index) => {
          if (block.type === "text") {
            return (
              <textarea
                key={block.id}
                ref={(el) => {
                  textareaRefs.current[block.id] = el;
                }}
                value={block.content}
                onChange={(e) => {
                  updateTextBlock(block.id, e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => autoResize(e.target)}
                placeholder={
                  index === 0 && blocks.length === 1
                    ? placeholder
                    : ""
                }
                disabled={disabled}
                className={cn(
                  "w-full bg-transparent outline-none resize-none border-none p-0 m-0",
                  "text-base sm:text-lg leading-relaxed",
                  "text-gray-800 dark:text-gray-200",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                style={{ minHeight: "1.5em" }}
                rows={1}
              />
            );
          }

          // Reflection block
          const meta = reflections[block.reflectionId] || {
            status: "loading" as const,
            isCollapsed: false,
            suggestion: null,
          };

          return (
            <ReflectionBlock
              key={block.id}
              suggestion={meta.suggestion}
              state={meta.status}
              isCollapsed={meta.isCollapsed}
              onToggleCollapse={() => handleToggleCollapse(block.reflectionId)}
              onAccept={() => handleAccept(block.reflectionId)}
              onDecline={() => removeReflection(block.reflectionId)}
              onRetry={() => handleRetry(block.reflectionId)}
              onDelete={() => removeReflection(block.reflectionId)}
              onCopy={() => {
                if (meta.suggestion) {
                  navigator.clipboard.writeText(
                    `${meta.suggestion.title}\n\n${meta.suggestion.description}`
                  );
                }
              }}
            />
          );
        })}

        {/* Click area to focus editor */}
        <div
          className="h-40 cursor-text"
          onClick={handleEditorClick}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}