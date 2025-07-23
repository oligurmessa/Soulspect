"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { CodeNode } from '@lexical/code' // not being used but included for transformer compatibility
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text'
import { $createListNode, $createListItemNode } from '@lexical/list'
import { $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection, $getRoot } from 'lexical'
import { $insertNodes } from 'lexical'
import { TRANSFORMERS } from '@lexical/markdown'

// Plugin Components
function SlashCommandMenuPlugin({ matchers }: { matchers: Matcher[] }) {
  const [editor] = useLexicalComposerContext()
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredMatchers = matchers.filter(matcher =>
    matcher.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
    matcher.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode()
          const text = anchorNode.getTextContent()
          const offset = selection.anchor.offset
          
          // Check if we're at the start of a line and typed '/'
          if (text.charAt(offset - 1) === '/' && (offset === 1 || text.charAt(offset - 2) === '\n')) {
            setShowMenu(true)
            setSearchQuery('')
            setSelectedIndex(0)
            
            // Get cursor position for menu placement
            const domSelection = window.getSelection()
            if (domSelection && domSelection.rangeCount > 0) {
              const range = domSelection.getRangeAt(0)
              const rect = range.getBoundingClientRect()
              setMenuPosition({ x: rect.left, y: rect.bottom + 5 })
            }
          } else if (showMenu) {
            // Extract search query after '/'
            const lastSlashIndex = text.lastIndexOf('/', offset)
            if (lastSlashIndex !== -1) {
              const query = text.substring(lastSlashIndex + 1, offset)
              setSearchQuery(query)
            } else {
              setShowMenu(false)
            }
          }
        }
      })
    })

    return removeListener
  }, [editor, showMenu])

  const handleCommand = useCallback((matcher: Matcher) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        // Remove the '/' and any search text
        const anchorNode = selection.anchor.getNode()
        const text = anchorNode.getTextContent()
        const offset = selection.anchor.offset
        const lastSlashIndex = text.lastIndexOf('/', offset)
        
        if (lastSlashIndex !== -1) {
          selection.anchor.offset = lastSlashIndex
          selection.focus.offset = offset
          matcher.insert()
        }
      }
    })
    setShowMenu(false)
  }, [editor])

  if (!showMenu) return null

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 w-64"
      style={{ left: menuPosition.x, top: menuPosition.y }}
    >
      {filteredMatchers.map((matcher, index) => (
        <button
          key={matcher.command}
          className={`w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${index === selectedIndex ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
          onClick={() => handleCommand(matcher)}
        >
          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {matcher.command}
          </span>
          <span className="text-sm">{matcher.description}</span>
        </button>
      ))}
    </div>
  )
}

function FloatingTextFormatToolbar() {
  const [editor] = useLexicalComposerContext()
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          setIsVisible(true)
          
          // Get selection bounds for toolbar positioning
          const domSelection = window.getSelection()
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            setPosition({
              x: rect.left + rect.width / 2,
              y: rect.top - 10
            })
          }

          // Check current format state
          setIsBold(selection.hasFormat('bold'))
          setIsItalic(selection.hasFormat('italic'))
        } else {
          setIsVisible(false)
        }
      })
    })

    return removeListener
  }, [editor])

  const formatText = useCallback((format: string) => {
    editor.dispatchCommand(format as any, undefined)
  }, [editor])

  if (!isVisible) return null

  return (
    <div
      className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-lg flex items-center space-x-1 p-1"
      style={{
        left: position.x - 80,
        top: position.y,
        transform: 'translateY(-100%)'
      }}
    >
      <button
        className={`p-2 rounded hover:bg-gray-700 ${isBold ? 'bg-gray-700' : ''}`}
        onClick={() => formatText('bold')}
      >
        <strong>B</strong>
      </button>
      <button
        className={`p-2 rounded hover:bg-gray-700 ${isItalic ? 'bg-gray-700' : ''}`}
        onClick={() => formatText('italic')}
      >
        <em>I</em>
      </button>
      <button
        className="p-2 rounded hover:bg-gray-700"
        onClick={() => formatText('underline')}
      >
        <u>U</u>
      </button>
      <button
        className="p-2 rounded hover:bg-gray-700"
        onClick={() => formatText('strikethrough')}
      >
        <s>S</s>
      </button>
    </div>
  )
}

// Types
interface Matcher {
  command: string
  description: string
  insert: () => void
}

// Editor configuration
const editorConfig = {
  namespace: 'journal-editor', // Change 1. Add a unique namespace string
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    LinkNode,
    CodeNode,
    AutoLinkNode, // Change 3. Register AutoLinkNode
  ],
  theme: {
    paragraph: 'm-0 p-0 leading-relaxed text-gray-800 dark:text-gray-100',
    heading: {
      h1: 'text-3xl font-bold my-4 text-gray-900 dark:text-gray-100',
      h2: 'text-2xl font-semibold my-3 text-gray-900 dark:text-gray-100',
      h3: 'text-xl font-medium my-2 text-gray-900 dark:text-gray-100',
    },
    list: {
      listitem: 'ml-6 list-disc text-gray-800 dark:text-gray-100',
      listitemChecked: 'ml-6 list-disc text-gray-800 dark:text-gray-100',
      listitemUnchecked: 'ml-6 list-disc text-gray-800 dark:text-gray-100',
      nested: {
        listitem: 'ml-6 list-disc',
      },
      ol: 'ml-6 list-decimal',
      ul: 'ml-6 list-disc',
    },
    quote: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 my-4',
    link: 'text-blue-600 hover:text-blue-800 underline',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
    },
  },
  onError: (error: Error) => {
    console.error('Lexical Error:', error)
  },
}

export default function TextEditor() {
  const [editorState, setEditorState] = useState<string>('')
  const [editor] = useLexicalComposerContext()
  const editorRef = useRef<HTMLDivElement>(null)

  // Slash command definitions
  const slashCommands: Matcher[] = [
    {
      command: 'h1',
      description: 'Large heading',
      insert: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const headingNode = $createHeadingNode('h1')
            $insertNodes([headingNode])
          }
        })
      }
    },
    {
      command: 'h2',
      description: 'Medium heading',
      insert: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const headingNode = $createHeadingNode('h2')
            $insertNodes([headingNode])
          }
        })
      }
    },
    {
      command: 'h3',
      description: 'Small heading',
      insert: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const headingNode = $createHeadingNode('h3')
            $insertNodes([headingNode])
          }
        })
      }
    },
    {
      command: 'quote',
      description: 'Quote block',
      insert: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const quoteNode = $createQuoteNode()
            $insertNodes([quoteNode])
          }
        })
      }
    },
    {
      command: 'ul',
      description: 'Bullet list',
      insert: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const listNode = $createListNode('bullet')
            const listItemNode = $createListItemNode()
            listItemNode.append($createTextNode(''))
            listNode.append(listItemNode)
            $insertNodes([listNode])
          }
        })
      }
    },
    {
      command: 'ol',
      description: 'Numbered list',
      insert: () => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const listNode = $createListNode('number')
            const listItemNode = $createListItemNode()
            listItemNode.append($createTextNode(''))
            listNode.append(listItemNode)
            $insertNodes([listNode])
          }
        })
      }
    },
// Add more commands as needed
  ]

  const onChange = useCallback((editorState: any) => {
    editorState.read(() => {
      const root = editorState._nodeMap.get('root')
      if (root) {
        setEditorState(JSON.stringify(editorState.toJSON()))
      }
    })
  }, [])

  // Autosave feature (debounced)
  useEffect(() => {
    if (!editorState) return
    
    const handler = setTimeout(() => {
      // Save to localStorage as backup
      try {
        localStorage.setItem('journal-editor-state', editorState)
      } catch (error) {
        console.error('Failed to save editor state:', error)
      }
    }, 1000)
    
    return () => clearTimeout(handler)
  }, [editorState])

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('journal-editor-state')
      if (savedState && editor) {
        const parsedState = JSON.parse(savedState)
        editor.setEditorState(editor.parseEditorState(parsedState))
      }
    } catch (error) {
      console.error('Failed to load saved editor state:', error)
    }
  }, [editor])

  return (
    <div className="min-h-full px-4 pt-2">
      {/* Floating toolbar appears on text selection */}
      <FloatingTextFormatToolbar />
      
      {/* Slash command menu triggered by '/' */}
      <SlashCommandMenuPlugin matchers={slashCommands} />

      <div className="flex flex-col h-full w-full">
        {/* Mobile toolbar (bottom) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-3 flex justify-around items-center z-40">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => editor.dispatchCommand('bold' as any, undefined)}
          >
            <strong className="text-gray-700 dark:text-gray-300">B</strong>
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => editor.dispatchCommand('italic' as any, undefined)}
          >
            <em className="text-gray-700 dark:text-gray-300">I</em>
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => {
              editor.update(() => {
                const selection = $getSelection()
                if ($isRangeSelection(selection)) {
                  const listNode = $createListNode('bullet')
                  const listItemNode = $createListItemNode()
                  listItemNode.append($createTextNode(''))
                  listNode.append(listItemNode)
                  $insertNodes([listNode])
                }
              })
            }}
          >
            <span className="text-gray-700 dark:text-gray-300">•</span>
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => {
              editor.update(() => {
                const selection = $getSelection()
                if ($isRangeSelection(selection)) {
                  const headingNode = $createHeadingNode('h2')
                  $insertNodes([headingNode])
                }
              })
            }}
          >
            <span className="text-gray-700 dark:text-gray-300 font-semibold">H</span>
          </button>
        </div>

        {/* Editor area */}
        <div
          ref={editorRef}
          className="flex-1 overflow-y-auto p-6 md:p-12 bg-background pb-20 md:pb-6"
        >
          <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="min-h-[400px] w-full outline-none prose prose-lg max-w-none focus:outline-none"
                  style={{ caretColor: '#3B82F6' }}
                />
              }
              placeholder={
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 italic pointer-events-none">
                  Start writing your thoughts... Use "/" for commands
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrapper component to provide Lexical context
interface TextEditorWrapperProps {
  content?: string;
  onContentChange?: (content: string) => void;
}

export function TextEditorWrapper({ content, onContentChange }: TextEditorWrapperProps) {
  const handleChange = useCallback((editorState: any) => {
    const textContent = editorState.read(() => $getRoot().getTextContent());
    if (onContentChange) {
      onContentChange(textContent);
    }
  }, [onContentChange]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <TextEditor />
      <HistoryPlugin />
      <AutoFocusPlugin />
      <OnChangePlugin onChange={handleChange} />
      <ListPlugin />
      <LinkPlugin />
      <AutoLinkPlugin matchers={[]} />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
    </LexicalComposer>
  )
}