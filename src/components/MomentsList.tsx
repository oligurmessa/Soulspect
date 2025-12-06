"use client";

import { Clock, Star, Heart, MessageSquare, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";

interface MomentItem {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  type?: string;
  mood?: number;
  emotions?: string[];
  attachments?: string[];
}

interface MomentsListProps {
  moments: MomentItem[];
  onMomentClick?: (moment: MomentItem) => void;
  className?: string;
}

export function MomentsList({ moments, onMomentClick, className }: MomentsListProps) {
  const formatTimestamp = (date: Date) => {
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else if (isThisWeek(date)) {
      return format(date, "EEEE");
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  const getPriorityFromMood = (mood?: number) => {
    if (!mood) return "Medium";
    if (mood <= 2) return "Low";
    if (mood <= 4) return "Medium";
    return "High";
  };

  const getPreview = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  if (moments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No moments yet</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
            Start capturing your thoughts and experiences
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {moments.map((moment, index) => (
        <div
          key={moment.id}
          onClick={() => onMomentClick?.(moment)}
          className={cn(
            "px-6 py-5 bg-zinc-800 border-b border-zinc-700",
            onMomentClick && "cursor-pointer hover:bg-zinc-700 transition-colors",
            index === 0 && "border-t border-t-zinc-700"
          )}
        >
          <h3 className="text-white text-base font-normal mb-1">
            {moment.title || "Untitled"}
          </h3>
          <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
            {getPreview(moment.content, 150)}
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimestamp(moment.timestamp)}</span>
            </div>
            {moment.mood && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                <span>{getPriorityFromMood(moment.mood)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}