
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MessageSquare } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// Mock function for AI dialogue
const getAIResponse = async (history: Message[]): Promise<string> => {
  const userMessage = history[history.length - 1].text;
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(
        `You said: "${userMessage.substring(0, 50)}...". ` +
        `That brings to mind an image of a winding river. What does this river look like to you?`
      );
    }, 1500);
  });
};

export const ActiveImagination = () => {
  const [history, setHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat on new message
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const newHistory: Message[] = [...history, { sender: 'user', text: userInput }];
    setHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    const aiResponse = await getAIResponse(newHistory);
    setHistory(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gray-800 rounded-lg text-white flex flex-col h-[60vh]"
    >
      <h3 className="text-2xl font-bold mb-4 text-blue-300 flex items-center">
        <MessageSquare className="w-6 h-6 mr-2" /> Active Imagination
      </h3>
      <p className="text-gray-400 mb-4">Begin a dialogue with your inner self. Start by describing a feeling, image, or thought.</p>
      
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-900/50 rounded-lg space-y-4">
        {history.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-lg p-3 rounded-lg bg-gray-700">
              <LoadingSpinner />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center">
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !userInput.trim()}
          className="ml-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Send
        </Button>
      </div>
    </motion.div>
  );
};
