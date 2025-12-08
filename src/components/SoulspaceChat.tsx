"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromptInputBox } from '@/components/ai-prompt-box';
import { GeminiSparkle } from '@/components/ui/icons/gemini-sparkle';
import { EnhancedAIClient } from '@/lib/vectorClient';
import { useAuth } from '@/context/AuthContext';
import { createUnifiedMoment } from '@/lib/momentClient';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    type?: 'explore' | 'release' | 'decide' | 'normal';
    relatedEntries?: any[];
    patterns?: string[];
    suggestions?: string[];
}

interface SoulspaceChatProps {
    mode: 'floating' | 'full';
    isOpen?: boolean; // Only for floating mode
    onClose?: () => void; // Only for floating mode
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.sender === 'user';
    const [showInsights, setShowInsights] = useState(false);

    const hasInsights = !isUser && (
        (message.patterns?.length ?? 0) > 0 ||
        (message.suggestions?.length ?? 0) > 0 ||
        (message.relatedEntries?.length ?? 0) > 0
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`mb-4 ${isUser ? 'flex justify-end' : ''}`}
        >
            {isUser ? (
                // User message - with card background
                <div className="max-w-[85%]">
                    <div className="rounded-2xl px-3.5 py-2.5 text-sm shadow-sm border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700">
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                </div>
            ) : (
                // AI message - plain text, no background
                <div className="max-w-[90%]">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {message.content}
                    </p>

                    {/* Insights Toggle */}
                    {hasInsights && (
                        <button
                            onClick={() => setShowInsights(!showInsights)}
                            className="flex items-center gap-1.5 mt-2.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                            {showInsights ? (
                                <ChevronUp className="w-3 h-3" strokeWidth={2} />
                            ) : (
                                <ChevronDown className="w-3 h-3" strokeWidth={2} />
                            )}
                            <span className="font-medium">{showInsights ? 'Hide' : 'View'} Insights</span>
                        </button>
                    )}

                    {/* Expanded Insights */}
                    <AnimatePresence>
                        {showInsights && hasInsights && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-3 space-y-2.5"
                            >
                                {message.patterns && message.patterns.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            Patterns
                                        </p>
                                        <div className="space-y-1">
                                            {message.patterns.map((pattern, i) => (
                                                <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                    • {pattern}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {message.suggestions && message.suggestions.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            Suggestions
                                        </p>
                                        <div className="space-y-1">
                                            {message.suggestions.map((suggestion, i) => (
                                                <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                    • {suggestion}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {message.relatedEntries && message.relatedEntries.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            Related Entries
                                        </p>
                                        <div className="space-y-1">
                                            {message.relatedEntries.map((entry, i) => (
                                                <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400 truncate leading-relaxed">
                                                    • {entry.preview} ({entry.type})
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};

// ============================================================================
// TYPING INDICATOR
// ============================================================================

const TypingIndicator: React.FC = () => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mb-4"
    >
        <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SoulspaceChat({ mode, isOpen, onClose }: SoulspaceChatProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasIndexed = useRef(false);

    // ============================================================================
    // AUTO-SCROLL
    // ============================================================================

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, scrollToBottom]);

    // ============================================================================
    // MESSAGE UTILITIES
    // ============================================================================

    const detectMessageType = (content: string): Message['type'] => {
        const lower = content.toLowerCase();
        if (lower.includes('[explore') || lower.includes('explore:')) return 'explore';
        if (lower.includes('[release') || lower.includes('release:')) return 'release';
        if (lower.includes('[decide') || lower.includes('decide:')) return 'decide';
        return 'normal';
    };

    const cleanMessage = (content: string): string => {
        return content
            .replace(/^\[Explore Subconscious:\s*/i, '')
            .replace(/^\[Explore:\s*/i, '')
            .replace(/^\[Release:\s*/i, '')
            .replace(/^\[Decide:\s*/i, '')
            .replace(/\]$/i, '')
            .trim();
    };

    // ============================================================================
    // DATA INDEXING
    // ============================================================================

    useEffect(() => {
        if (!user || (mode === 'floating' && !isOpen) || hasIndexed.current || isIndexing) return;

        const indexData = async () => {
            setIsIndexing(true);
            try {
                await EnhancedAIClient.indexUserData(user.uid);
                hasIndexed.current = true;
                console.log('✓ User data indexed');
            } catch (error) {
                console.error('✗ Indexing error:', error);
            } finally {
                setIsIndexing(false);
            }
        };

        const sessionKey = `indexed_${user.uid}`;
        if (!sessionStorage.getItem(sessionKey)) {
            indexData();
            sessionStorage.setItem(sessionKey, 'true');
        } else {
            hasIndexed.current = true;
        }
    }, [user, isOpen, isIndexing, mode]);

    // ============================================================================
    // MESSAGE HANDLER
    // ============================================================================

    const handleSendMessage = async (message: string) => {
        if (!message.trim() || isTyping || !user) return;

        const messageType = detectMessageType(message);
        const cleanedContent = cleanMessage(message);

        // DEMO OVERRIDE: Hardcoded response for specific prompt
        const DEMO_PROMPT = "Why do I keep repeating the same mistakes even after promising myself I’d change?";
        if (cleanedContent.trim() === DEMO_PROMPT) {
            const userMessage: Message = {
                id: `user_${Date.now()}`,
                content: cleanedContent,
                sender: 'user',
                timestamp: new Date(),
                type: messageType,
            };
            setMessages(prev => [...prev, userMessage]);
            setIsTyping(true);

            setTimeout(() => {
                const aiMessage: Message = {
                    id: `ai_${Date.now()}`,
                    content: "Repeating a mistake isn’t a sign of weakness — it’s a sign of an unmet need. You’re not failing to change; you’re returning to something familiar, even if it hurts.\n\nThere’s usually a moment before the mistake where you feel the pull. What does that moment feel like for you?",
                    sender: 'ai',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, aiMessage]);
                setIsTyping(false);
            }, 1000);
            return;
        }

        // Add user message
        const userMessage: Message = {
            id: `user_${Date.now()}`,
            content: cleanedContent,
            sender: 'user',
            timestamp: new Date(),
            type: messageType,
        };

        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        // Create placeholder AI message
        const aiMessageId = `ai_${Date.now()}`;
        const initialAiMessage: Message = {
            id: aiMessageId,
            content: '',
            sender: 'ai',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, initialAiMessage]);

        try {
            let fullResponse = '';
            let contextData: any = null;

            await EnhancedAIClient.generateResponseStream(
                user.uid,
                cleanedContent,
                messageType || 'normal',
                'soulspace',
                (chunk) => {
                    fullResponse += chunk;
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMessageId
                            ? { ...msg, content: fullResponse }
                            : msg
                    ));
                },
                (context) => {
                    contextData = context;
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMessageId
                            ? {
                                ...msg,
                                relatedEntries: context.relatedEntries,
                                patterns: context.patterns,
                                suggestions: context.suggestions,
                                emotionalTrends: context.emotionalTrends
                            }
                            : msg
                    ));
                }
            );

            // Store chat as moment after completion
            try {
                const chatContent = `User: ${cleanedContent}\n\nAI: ${fullResponse}`;
                await createUnifiedMoment(user.uid, 'chat', undefined, chatContent, {
                    tags: [messageType || 'normal'],
                });
            } catch (error) {
                console.warn('Failed to store chat moment:', error);
            }

        } catch (error) {
            console.error('Message send error:', error);
            // Remove the empty AI message and show error
            setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));

            const errorMessage: Message = {
                id: `error_${Date.now()}`,
                content: "I'm having trouble connecting. Could you try again?",
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    // ============================================================================
    // NAVIGATION
    // ============================================================================

    const handleMaximize = () => {
        router.push('/dashboard/soulspace');
        onClose?.();
    };

    // ============================================================================
    // RENDER CONTENT
    // ============================================================================

    const renderContent = () => (
        <>
            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto px-4 pt-4 pb-4 bg-white dark:bg-zinc-900 ${mode === 'full' ? 'max-w-4xl mx-auto w-full' : ''}`}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-4">
                            <GeminiSparkle className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                        </div>
                        <h4 className="font-semibold text-base mb-2 text-zinc-900 dark:text-zinc-100">
                            Welcome to soulspace
                        </h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[16rem]">
                            Share your thoughts and I'll help you reflect and discover insights.
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                        <AnimatePresence>
                            {isTyping && <TypingIndicator />}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className={`bg-white dark:bg-zinc-900 flex-shrink-0 px-3 pb-3 pt-0 ${mode === 'full' ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
                <div className={mode === 'full' ? 'max-w-4xl mx-auto w-full' : ''}>
                    <PromptInputBox
                        onSend={handleSendMessage}
                        isLoading={isTyping}
                        placeholder="What's on your mind?"
                        className={mode === 'full' ? 'py-6' : 'py-0'}
                    />
                </div>
            </div>
        </>
    );

    // ============================================================================
    // RENDER CONTAINER
    // ============================================================================

    if (mode === 'floating') {
        return (
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed bottom-[4.5rem] left-2 right-2 sm:left-auto sm:bottom-24 sm:right-6 h-[50vh] sm:w-[22rem] sm:h-[32rem] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full transition-colors ${isIndexing
                                    ? 'bg-amber-500 animate-pulse'
                                    : 'bg-emerald-500'
                                    }`} />
                                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                    soulspace
                                </h3>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMaximize}
                                    className="h-7 w-7 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                                    title="Expand to full view"
                                >
                                    <Maximize2 className="w-3.5 h-3.5" strokeWidth={2} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="h-7 w-7 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                                    title="Close"
                                >
                                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                                </Button>
                            </div>
                        </div>

                        {renderContent()}
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    // Full Page Mode
    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
            {renderContent()}
        </div>
    );
}
