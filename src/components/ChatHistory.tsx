"use client";

import { useState, useEffect } from "react";
import { History, MessageSquare, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MomentClient } from "@/lib/momentClient";
import { useAuth } from "@/context/AuthContext";
import { Moment } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface ChatHistoryProps {
    onSelectChat?: (chat: Moment) => void;
}

export function ChatHistory({ onSelectChat }: ChatHistoryProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [chats, setChats] = useState<Moment[]>([]);

    useEffect(() => {
        if (isOpen && user) {
            fetchChats();
        }
    }, [isOpen, user]);

    const fetchChats = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const moments = await MomentClient.getMoments(user.uid, {
                type: 'chat',
                limit: 50
            });
            setChats(moments);
        } catch (error) {
            console.error("Failed to fetch chat history:", error);
        } finally {
            setLoading(false);
        }
    };

    const getDateFromTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp instanceof Date) return timestamp;
        if (typeof timestamp.toDate === 'function') return timestamp.toDate();
        if (timestamp.seconds && timestamp.nanoseconds) return new Date(timestamp.seconds * 1000);
        if (typeof timestamp === 'string') return new Date(timestamp);
        return new Date();
    };

    const getPreview = (content: string) => {
        // Try to extract the first user message
        const userMatch = content.match(/User: (.*?)(?:\n|$)/);
        if (userMatch) return userMatch[1];
        return content.slice(0, 100) + "...";
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                    <History className="h-5 w-5" />
                    <span className="sr-only">Chat History</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
                <SheetHeader className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <SheetTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Chat History
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-80px)]">
                    <div className="px-6 py-4 space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No chat history found.</p>
                            </div>
                        ) : (
                            chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="group relative flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        onSelectChat?.(chat);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {chat.createdAt ? formatDistanceToNow(getDateFromTimestamp(chat.createdAt), { addSuffix: true }) : 'Unknown date'}
                                        </span>
                                        {chat.tags && chat.tags.length > 0 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase tracking-wider font-semibold">
                                                {chat.tags[0]}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-relaxed">
                                        {getPreview(chat.content)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
