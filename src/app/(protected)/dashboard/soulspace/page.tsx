'use client';
import { PromptInputBox } from "@/components/ai-prompt-box";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, User, Brain, RotateCcw, Lightbulb } from 'lucide-react';
import { runGeminiPrompt } from '@/lib/gemini';


// Message interface
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'explore' | 'release' | 'decide' | 'normal';
}

// Message component
const MessageBubble: React.FC<{ message: Message; isLast: boolean }> = ({ message, isLast }) => {
  const isUser = message.sender === 'user';
  
  const getTypeIcon = () => {
    switch (message.type) {
      case 'explore': return <Brain className="w-4 h-4 text-blue-400" />;
      case 'release': return <RotateCcw className="w-4 h-4 text-purple-400" />;
      case 'decide': return <Lightbulb className="w-4 h-4 text-orange-400" />;
      default: return null;
    }
  };

  const getTypeColor = () => {
    switch (message.type) {
      case 'explore': return 'border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300';
      case 'release': return 'border-purple-500/30 bg-purple-500/10 text-purple-800 dark:text-purple-300';
      case 'decide': return 'border-orange-500/30 bg-orange-500/10 text-orange-800 dark:text-orange-300';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(' ');
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
      className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg flex-shrink-0">
          <Loader className="w-4 h-4" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300",
            isUser ? getTypeColor() : "bg-transparent text-foreground"
          )}
        >
          {message.type && (
            <div className="flex items-center gap-2 mb-2 opacity-80">
              {getTypeIcon()}
              <span className="text-xs font-medium capitalize">{message.type} Mode</span>
            </div>
          )}
          
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          
          <div className={`text-xs mt-2 opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );
};

// Typing indicator
const TypingIndicator: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex gap-3 mb-6"
  >
    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-lg">
      <Loader className="w-4 h-4 text-secondary-foreground" />
    </div>

    <div className="bg-secondary rounded-2xl px-4 py-3 border border-border/30 shadow-lg backdrop-blur-sm">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-muted-foreground rounded-full"
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

// Welcome message component

// Main page component
export default function SoulspaceChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Detect message type from content
  const detectMessageType = (content: string): Message['type'] => {
    if (content.startsWith('[Explore Subconscious:')) return 'explore';
    if (content.startsWith('[Release:')) return 'release';
    if (content.startsWith('[Decide:')) return 'decide';
    return 'normal';
  };

  // Clean message content (remove prefixes)
  const cleanMessage = (content: string): string => {
    return content
      .replace(/^\[Explore Subconscious:\s*/, '')
      .replace(/^\[Release:\s*/, '')
      .replace(/^\[Decide:\s*/, '')
      .replace(/\]$/, '');
  };

  // Handle sending messages
  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim()) return;

    const messageType = detectMessageType(content);
    const cleanedContent = cleanMessage(content);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: cleanedContent,
      sender: 'user',
      timestamp: new Date(),
      type: messageType,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Generate AI response using Gemini API
      const aiResponse = await generateGeminiResponse(cleanedContent, messageType);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble responding right now. Please try again in a moment.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Generate AI responses using Gemini API
  const generateGeminiResponse = async (content: string, type: Message['type']): Promise<string> => {
    const modeContext = {
      explore: "You are a wise guide helping someone explore their subconscious mind and inner patterns. Respond with deep, insightful questions and reflections that help them uncover hidden truths about themselves. Be compassionate, intuitive, and encourage self-discovery.",
      release: "You are a healing companion helping someone release what no longer serves them. Focus on transformation, letting go, and creating space for new growth. Be supportive, gentle, and encouraging about the healing process.",
      decide: "You are a clarity guide helping someone make important decisions. Help them connect with their inner wisdom and intuition. Ask questions that reveal their deeper knowing and true desires. Be empowering and trust-building.",
      normal: "You are a supportive companion in someone's journey of self-discovery and inner transformation. Be warm, understanding, and offer gentle guidance toward greater self-awareness."
    };

    const systemPrompt = modeContext[type || 'normal'];
    const prompt = `${systemPrompt}

User's message: "${content}"

Respond as a compassionate guide in 1-3 sentences. Be authentic, insightful, and helpful.`;

    try {
      const response = await runGeminiPrompt(prompt);
      return response;
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback responses
      const fallbackResponses = {
        explore: "I sense you're reaching into deeper layers of awareness. What patterns do you notice emerging as you reflect on this?",
        release: "Releasing can be both liberating and challenging. What would it feel like to let this go completely?",
        decide: "Decisions become clearer when we align with our deeper knowing. What does your intuition whisper about this choice?",
        normal: "Thank you for sharing that with me. I'm here to support your journey of self-discovery."
      };
      return fallbackResponses[type || 'normal'];
    }
  };

  return (
    <div className="h-full text-foreground flex flex-col relative">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ paddingBottom: '160px' }} // Space for fixed input
      >
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-80">
              <div className="mb-4">
                <Loader className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Welcome to Soulspace</h2>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                This is your private space for reflection, transformation, and decision-making. Share what's on your mind and let the AI guide you through different modes of self-discovery.
              </p>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLast={index === messages.length - 1}
                />
              ))}
            </div>
          )}

          <AnimatePresence>
            {isTyping && <TypingIndicator />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Chat Input - positioned relative to the SidebarInset */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-6 lg:px-8">
          <div className="transition-all duration-300 ease-in-out">
            <PromptInputBox
              onSend={handleSendMessage}
              isLoading={isTyping}
              placeholder="Share what's on your mind..."
              className="w-full"
            />
          </div>
        
        </div>
      </div>
    </div>
  );
}