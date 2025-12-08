"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
    Smile, Frown, Meh, MessageSquare, Mic, Video, ImageIcon,
    Type, Tag, Paperclip, MoreVertical, Bookmark, Edit2, Trash2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface MomentEntry {
    id: string;
    date: Date;
    type: 'emotion' | 'journal' | 'voice' | 'photo' | 'video' | 'chat';
    entryType?: 'text' | 'voice' | 'video';
    title?: string;
    content?: string;
    mood?: number;
    emotions?: string[];
    triggers?: string[];
    context?: string;
    intensity?: number;
    isDraft?: boolean;
    attachments?: string[];
    tags?: string[];
    location?: string;
    weather?: string;
    carouselContent?: any;
}

interface MomentCardProps {
    entry: MomentEntry;
    onView: (entry: MomentEntry) => void;
    onEdit: (entry: MomentEntry) => void;
    onDelete: (entry: MomentEntry) => void;
}

export function MomentCard({ entry, onView, onEdit, onDelete }: MomentCardProps) {

    const getEntryIcon = () => {
        if (entry.entryType === 'video' || entry.type === 'video') return <Video className="w-3.5 h-3.5" />;
        if (entry.entryType === 'voice' || entry.type === 'voice') return <Mic className="w-3.5 h-3.5" />;
        if (entry.type === 'photo') return <ImageIcon className="w-3.5 h-3.5" />;
        if (entry.type === 'chat') return <MessageSquare className="w-3.5 h-3.5" />;
        if (entry.type === 'emotion') {
            const mood = entry.mood || 3;
            return mood <= 2 ? <Frown className="w-3.5 h-3.5" /> :
                mood >= 5 ? <Smile className="w-3.5 h-3.5" /> :
                    <Meh className="w-3.5 h-3.5" />;
        }
        return <Type className="w-3.5 h-3.5" />;
    };

    const getEntryTypeLabel = () => {
        if (entry.entryType === 'video' || entry.type === 'video') return 'Video';
        if (entry.entryType === 'voice' || entry.type === 'voice') return 'Voice';
        if (entry.type === 'photo') return 'Photo';
        if (entry.type === 'chat') return 'AI Chat';
        if (entry.type === 'emotion') return 'Emotion';
        return 'Text';
    };

    const formatTimestamp = (date: Date) => {
        try {
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (e) {
            return date.toLocaleDateString();
        }
    };

    const getPreview = (content?: string, maxLength = 120) => {
        if (!content) return "";
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + "...";
    };

    const hasAttachments = (entry.attachments && entry.attachments.length > 0) ||
        (entry.carouselContent && (
            (entry.carouselContent.photos && entry.carouselContent.photos.length > 0) ||
            (entry.carouselContent.audioRecordings && entry.carouselContent.audioRecordings.length > 0)
        ));

    return (
        <div
            onClick={() => onView(entry)}
            className={cn(
                "group relative flex flex-col gap-3",
                "p-4 sm:p-5",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-200 dark:border-zinc-800",
                "rounded-2xl transition-all duration-200",
                "active:scale-[0.99] active:bg-zinc-50 dark:active:bg-zinc-800/50", // Mobile touch feedback
                "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm cursor-pointer"
            )}
        >
            {/* Header Row: Icon/Type + Date + Actions (Right aligned) */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                        "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    )}>
                        {getEntryIcon()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {entry.title || getEntryTypeLabel()}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(entry.date)}</span>
                        </div>
                    </div>
                </div>

                {/* Mobile Actions Menu (Dropdown) -> Saves space */}
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                                <MoreVertical className="w-4 h-4" />
                                <span className="sr-only">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onView(entry)}>
                                <Bookmark className="w-4 h-4 mr-2" />
                                View
                            </DropdownMenuItem>
                            {entry.type === 'journal' && (
                                <DropdownMenuItem onClick={() => onEdit(entry)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onDelete(entry)}
                                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content Body */}
            <div className="space-y-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {entry.type === 'emotion' ?
                        (entry.context ? getPreview(entry.context) : entry.emotions?.join(', ') || 'No content') :
                        getPreview(entry.content)
                    }
                </p>

                {/* Feature: Full-width Image Preview for Mobile (if first attachment is image) */}
                {entry.carouselContent?.photos?.[0] && (
                    <div className="relative w-full h-32 sm:h-40 mt-2 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                            src={entry.carouselContent.photos[0].url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        {entry.carouselContent.photos.length > 1 && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] text-white font-medium">
                                +{entry.carouselContent.photos.length - 1}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer: Badges/Tags */}
            <div className="flex flex-wrap gap-2 mt-1">
                {/* Emotions Badge */}
                {entry.emotions && entry.emotions.length > 0 && (
                    <Badge variant="secondary" className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-900/50 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-[10px] px-2 py-0.5 h-5 font-normal">
                        {entry.emotions[0]}
                        {entry.emotions.length > 1 && ` +${entry.emotions.length - 1}`}
                    </Badge>
                )}

                {/* Tags */}
                {entry.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0.5 h-5 font-normal text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">
                        {tag}
                    </Badge>
                ))}

                {/* Attachment Indicator (if not shown as preview) */}
                {hasAttachments && !entry.carouselContent?.photos?.[0] && (
                    <Badge variant="secondary" className="gap-1 text-[10px] px-2 py-0.5 h-5 font-normal bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        <Paperclip className="w-3 h-3" />
                        <span>Media</span>
                    </Badge>
                )}
            </div>
        </div>
    );
}
