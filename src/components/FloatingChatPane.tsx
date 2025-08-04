"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, User, Brain, RotateCcw, Lightbulb, Minimize2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedAIClient, VectorClient } from '@/lib/vectorClient';
import { useAuth } from '@/context/AuthContext';
import { createUnifiedMoment } from '@/lib/momentClient';
import VectorSystem from '@/lib/vectorSystem';

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

interface FloatingChatPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [showDetails, setShowDetails] = useState(false);
  
  const getTypeIcon = () => {
    switch (message.type) {
      case 'explore': return <Brain className="w-3 h-3 text-blue-400" />;
      case 'release': return <RotateCcw className="w-3 h-3 text-purple-400" />;
      case 'decide': return <Lightbulb className="w-3 h-3 text-orange-400" />;
      default: return null;
    }
  };

  const getTypeColor = () => {
    switch (message.type) {
      case 'explore': return 'border-blue-500/20 bg-blue-500/5 text-blue-800 dark:text-blue-300';
      case 'release': return 'border-purple-500/20 bg-purple-500/5 text-purple-800 dark:text-purple-300';
      case 'decide': return 'border-orange-500/20 bg-orange-500/5 text-orange-800 dark:text-orange-300';
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
    }
  };

  const hasEnhancedData = !isUser && (
    message.patterns?.length || 
    message.suggestions?.length || 
    message.relatedEntries?.length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
          {hasEnhancedData ? (
            <Sparkles className="w-3 h-3 text-blue-500" />
          ) : (
            <Loader2 className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
          )}
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-xl px-3 py-2 text-sm shadow-sm border ${
            isUser ? getTypeColor() : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700'
          }`}
        >
          {message.type && isUser && (
            <div className="flex items-center gap-1 mb-1 opacity-70">
              {getTypeIcon()}
              <span className="text-xs font-medium capitalize">{message.type}</span>
            </div>
          )}
          
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

          {/* Enhanced AI insights */}
          {hasEnhancedData && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <Sparkles className="w-3 h-3" />
                {showDetails ? 'Hide' : 'Show'} Insights
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700"
                  >
                    {message.patterns && message.patterns.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Patterns:</p>
                        {message.patterns.map((pattern, i) => (
                          <p key={i} className="text-xs text-zinc-500 dark:text-zinc-500">• {pattern}</p>
                        ))}
                      </div>
                    )}

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Suggestions:</p>
                        {message.suggestions.map((suggestion, i) => (
                          <p key={i} className="text-xs text-zinc-500 dark:text-zinc-500">• {suggestion}</p>
                        ))}
                      </div>
                    )}

                    {message.relatedEntries && message.relatedEntries.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Related Entries:</p>
                        {message.relatedEntries.map((entry, i) => (
                          <p key={i} className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
                            • {entry.preview} ({entry.type})
                          </p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
          
          <div className={`text-xs mt-1 opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
        </div>
      )}
    </motion.div>
  );
};

const TypingIndicator: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex gap-2 mb-3"
  >
    <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
      <Loader2 className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
    </div>

    <div className="bg-white dark:bg-zinc-800 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-700 shadow-sm">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-zinc-400 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

export default function FloatingChatPane({ isOpen, onClose }: FloatingChatPaneProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const detectMessageType = (content: string): Message['type'] => {
    if (content.startsWith('[Explore Subconscious:')) return 'explore';
    if (content.startsWith('[Release:')) return 'release';
    if (content.startsWith('[Decide:')) return 'decide';
    return 'normal';
  };

  const cleanMessage = (content: string): string => {
    return content
      .replace(/^\[Explore Subconscious:\s*/, '')
      .replace(/^\[Release:\s*/, '')
      .replace(/^\[Decide:\s*/, '')
      .replace(/\]$/, '');
  };

  // Index user data on first use
  useEffect(() => {
    if (user && isOpen && !isIndexing) {
      const indexData = async () => {
        setIsIndexing(true);
        try {
          await EnhancedAIClient.indexUserData(user.uid);
          console.log('User data indexed successfully');
        } catch (error) {
          console.error('Error indexing user data:', error);
        } finally {
          setIsIndexing(false);
        }
      };
      
      // Only index once per session
      if (!sessionStorage.getItem(`indexed_${user.uid}`)) {
        indexData();
        sessionStorage.setItem(`indexed_${user.uid}`, 'true');
      }
    }
  }, [user, isOpen, isIndexing]);

  const generateEnhancedResponse = async (content: string, type: Message['type']): Promise<Message> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Generating AI response for:', { content, type, userId: user.uid });
      const insight = await EnhancedAIClient.generateResponse(
        user.uid,
        content,
        type || 'normal'
      );
      console.log('AI response received:', { 
        hasResponse: !!insight.response, 
        hasPatterns: !!insight.patterns?.length,
        hasSuggestions: !!insight.suggestions?.length,
        hasRelatedEntries: !!insight.relatedEntries?.length
      });

      // Store chat history as a moment in the optimized unified structure
      try {
        const chatContent = `User: ${content}\n\nAI Response: ${insight.response}`;
        
        const momentId = await createUnifiedMoment(
          user.uid,
          'chat',
          undefined, // no title for chats
          chatContent,
          {
            tags: [type || 'normal'],
          }
        );
        
        console.log('Chat moment created and auto-indexed:', momentId);
      } catch (momentError) {
        console.warn('Error storing chat as moment:', momentError);
        
        // Fallback to legacy vector storage (non-blocking)
        try {
          await VectorClient.indexItem(
            user.uid,
            `chat_${Date.now()}`,
            {
              userMessage: content,
              aiResponse: insight.response,
              mode: type || 'normal',
              timestamp: Date.now(),
            },
            'chat'
          );
        } catch (vectorError) {
          console.warn('Vector indexing also failed:', vectorError);
          // Continue anyway - don't block the chat experience
        }
      }

      return {
        id: (Date.now() + 1).toString(),
        content: insight.response,
        sender: 'ai',
        timestamp: new Date(),
        relatedEntries: insight.relatedEntries,
        patterns: insight.patterns,
        suggestions: insight.suggestions,
      };
    } catch (error) {
      console.error('Error generating enhanced response:', error);
      
      console.error('AI response generation failed, using fallback:', error);
      
      // Fallback to basic response without assumptions
      const fallbackResponses = {
        explore: "I'm here to help you explore what's on your mind. What aspects of this situation feel most important to you right now?",
        release: "It sounds like you're working through something challenging. What would feel most supportive for you in this moment?",
        decide: "Making decisions can feel complex. What factors are you considering as you think through this choice?",
        normal: "Thank you for sharing that with me. I'm here to listen and support you. What would be most helpful for you right now?"
      };

      return {
        id: (Date.now() + 1).toString(),
        content: fallbackResponses[type || 'normal'],
        sender: 'ai',
        timestamp: new Date(),
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping || !user) return;

    const messageType = detectMessageType(inputValue);
    const cleanedContent = cleanMessage(inputValue);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: cleanedContent,
      sender: 'user',
      timestamp: new Date(),
      type: messageType,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const aiMessage = await generateEnhancedResponse(cleanedContent, messageType);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now, but I'm here to listen. Could you try rephrasing your question?",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 50 }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            y: 0,
            height: isMinimized ? 'auto' : '500px'
          }}
          exit={{ opacity: 0, x: 100, y: 50 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-20 right-6 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isIndexing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
              <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                {isIndexing ? 'Indexing Data...' : 'soulspace'}
              </h3>
              {isIndexing && (
                <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="mb-3">
                      <Loader2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <h4 className="font-medium text-sm mb-1 text-zinc-900 dark:text-zinc-100">Welcome to Soulspace</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Share your thoughts and let AI guide you through reflection and discovery.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    <AnimatePresence>
                      {isTyping && <TypingIndicator />}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share what's on your mind..."
                    className="flex-1 text-sm border-zinc-300 dark:border-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-500"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    size="sm"
                    className="px-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
                  >
                    {isTyping ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 text-center">
                  Private conversation • Data not stored
                </p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}