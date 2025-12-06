"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LiquidAudioPlayer } from "@/components/liquid-audio-player";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import {
  Smile,
  Frown,
  Meh,
  MessageSquare,
  Mic,
  Video,
  ImageIcon,
  Clock,
  Edit2,
  Type,
  Tag,
  Paperclip,
  Bookmark,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { getEmotionLogs, getJournalEntries, type EmotionLog, type JournalEntry as DBJournalEntry } from "@/lib/dbHelpers";
import { MomentClient } from "@/lib/momentClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


interface MomentEntry {
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
  // Legacy carousel content for backward compatibility
  carouselContent?: {
    photos: Array<{
      id: string | number;
      name: string;
      caption: string;
      url: string;
      createdAt: string;
    }>;
    emotions: Array<{
      id: string | number;
      emotion: string;
      intensity: number;
      note: string;
      emotions: string[];
      triggers: string[];
      createdAt: string;
    }>;
    audioRecordings: Array<{
      id: string | number;
      transcript: string;
      duration: number;
      createdAt: string;
      audioUrl?: string;
    }>;
  };
}

export default function JournalPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [data, setData] = React.useState<MomentEntry[]>([]);
  const [filteredData, setFilteredData] = React.useState<MomentEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<MomentEntry | null>(null);
  const [selectedImage, setSelectedImage] = React.useState<{url: string, name: string} | null>(null);
  
  // Filter and view states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

  // Fetch data from database - prioritize moments, fallback to legacy
  React.useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        let combinedData: MomentEntry[] = [];
        
        // Try to get moments first (new unified structure)
        try {
          console.log(`[Journal] Fetching moments for user: ${user.uid}`);
          const moments = await MomentClient.getMoments(user.uid, { limit: 200 });
          console.log(`[Journal] MomentClient returned:`, moments);
          
          if (moments.length > 0) {
            console.log(`[Journal] Found ${moments.length} moments, using new structure`);
            console.log(`[Journal] Sample moment:`, moments[0]);
            combinedData = moments.map((moment: Record<string, any>) => ({
              id: (moment.id as string) || '',
              date: new Date(moment.timestamp as string), // Convert ISO string to Date
              type: moment.type as MomentEntry['type'],
              title: moment.title as string,
              content: moment.content as string,
              mood: moment.mood as number,
              emotions: moment.emotions as string[],
              triggers: moment.triggers as string[],
              intensity: moment.intensity as number,
              attachments: moment.attachments as string[],
              tags: moment.tags as string[],
              location: moment.location as string,
              weather: moment.weather as string,
              // Map journal-specific data
              entryType: moment.journalData?.entryType as 'text' | 'voice' | 'video',
              isDraft: moment.journalData?.isDraft as boolean,
              // Map emotion-specific data
              context: moment.emotionData?.context as string,
            }));
          }
        } catch (momentError) {
          console.log('Error fetching moments or no moments found, falling back to legacy data:', momentError);
        }
        
        // Fallback to legacy data if no moments found
        if (combinedData.length === 0) {
          const [emotionLogs, journalEntries] = await Promise.all([
            getEmotionLogs(user.uid, 100),
            getJournalEntries(user.uid, 100)
          ]);

          combinedData = [
            ...emotionLogs.map((log: EmotionLog) => ({
              id: log.id || '',
              date: log.createdAt.toDate(),
              type: 'emotion' as const,
              mood: log.mood,
              emotions: log.emotions,
              triggers: log.triggers,
              context: log.context,
              intensity: log.intensity
            })),
            ...journalEntries.map((entry: DBJournalEntry) => ({
              id: entry.id || '',
              date: entry.date.toDate(),
              type: 'journal' as const,
              entryType: entry.entryType,
              title: entry.title,
              content: entry.content,
              mood: entry.mood,
              emotions: entry.emotions,
              isDraft: entry.isDraft,
              attachments: entry.attachments,
              carouselContent: entry.carouselContent
            }))
          ];
        }

        // Sort by date descending
        combinedData.sort((a, b) => b.date.getTime() - a.date.getTime());
        setData(combinedData);
      } catch (error) {
        console.error('Error fetching moments:', error);
        toast.error('Failed to load your moments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Get unique tags for filter
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    data.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => tagSet.add(tag));
      }
      // Also use type as a tag
      tagSet.add(entry.type);
    });
    return Array.from(tagSet);
  }, [data]);

  // Filter data
  React.useEffect(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title?.toLowerCase().includes(query) ||
        entry.content?.toLowerCase().includes(query) ||
        entry.emotions?.some(emotion => emotion.toLowerCase().includes(query)) ||
        entry.triggers?.some(trigger => trigger.toLowerCase().includes(query)) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (activeFilter) {
      filtered = filtered.filter(entry => 
        entry.type === activeFilter || entry.tags?.includes(activeFilter)
      );
    }

    // Always sort by newest first
    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

    setFilteredData(filtered);
  }, [data, searchQuery, activeFilter]);

  const handleViewEntry = (entry: MomentEntry) => {
    setSelectedEntry(entry);
    setViewDialogOpen(true);
  };

  const handleEditEntry = (entry: MomentEntry) => {
    // Only allow editing journal entries, not emotion logs
    if (entry.type !== 'journal') {
      toast.error("Cannot edit emotion logs");
      return;
    }

    // Navigate to log page with edit parameter
    router.push('/dashboard/log?edit=' + entry.id);
  };

  const handleDeleteEntry = async (entry: MomentEntry) => {
    if (confirm("Are you sure you want to delete this moment?")) {
      try {
        // TODO: Implement delete functionality
        toast.success("Moment deleted");
        // Refresh data
        setData(data.filter(d => d.id !== entry.id));
      } catch (error) {
        toast.error("Failed to delete moment");
      }
    }
  };

  const getEntryIcon = (entry: MomentEntry) => {
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

  const getEntryTypeLabel = (entry: MomentEntry) => {
    if (entry.entryType === 'video' || entry.type === 'video') return 'Video';
    if (entry.entryType === 'voice' || entry.type === 'voice') return 'Voice';
    if (entry.type === 'photo') return 'Photo';
    if (entry.type === 'chat') return 'AI Chat';
    if (entry.type === 'emotion') return 'Emotion';
    return 'Text';
  };

  const getAttachmentSummary = (entry: MomentEntry): string | null => {
    const counts: Record<string, number> = { photo: 0, audio: 0, video: 0 };
    
    // Count attachments
    if (entry.attachments) {
      entry.attachments.forEach(url => {
        if (url.includes('video_')) counts.video++;
        else if (url.includes('audio_')) counts.audio++;
        else counts.photo++;
      });
    }

    // Count carousel content
    if (entry.carouselContent) {
      if (entry.carouselContent.photos) counts.photo += entry.carouselContent.photos.length;
      if (entry.carouselContent.audioRecordings) counts.audio += entry.carouselContent.audioRecordings.length;
    }

    const parts: string[] = [];
    if (counts.photo) parts.push(`${counts.photo} photo${counts.photo > 1 ? 's' : ''}`);
    if (counts.audio) parts.push(`${counts.audio} audio`);
    if (counts.video) parts.push(`${counts.video} video${counts.video > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getPreview = (content?: string, maxLength = 150) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  const renderMomentCard = (entry: MomentEntry) => {
    const attachmentSummary = getAttachmentSummary(entry);

    return (
      <div
        key={entry.id}
        className="group rounded-2xl border border-zinc-200 bg-white/90 shadow-sm hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#202020] transition-all duration-200 px-6 py-5"
      >
        {/* Header: Title + Date */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-50 truncate">
              {entry.title || "Untitled"}
            </h2>
          </div>
          <div className="flex items-center text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/70 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            <span className="truncate">{formatTimestamp(entry.date)}</span>
          </div>
        </div>

        {/* Content */}
        <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 line-clamp-3">
          {entry.type === 'emotion' ? 
            (entry.context ? getPreview(entry.context) : entry.emotions?.join(', ') || 'No content') :
            getPreview(entry.content)
          }
        </p>

        {/* Meta + Actions */}
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Metadata badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            {/* Entry type */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-200">
              {getEntryIcon(entry)}
              <span className="font-medium">{getEntryTypeLabel(entry)}</span>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <>
                {entry.tags.slice(0, 2).map(tag => (
                  <div key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-200">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="font-medium">{tag}</span>
                  </div>
                ))}
              </>
            )}

            {/* Attachments */}
            {attachmentSummary && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-300">
                <Paperclip className="w-3.5 h-3.5" />
                <span>{attachmentSummary}</span>
              </div>
            )}

            {/* Emotion */}
            {entry.emotions && entry.emotions.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-100">
                <Smile className="w-3.5 h-3.5" />
                <span className="font-medium">{entry.emotions[0]}</span>
              </div>
            )}
          </div>

          {/* Right: Card actions */}
          <div className="flex items-center gap-1 self-start sm:self-auto">
            <Button
              variant="ghost"
              className="h-9 w-9 p-0 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-105 transition-all"
              aria-label="View"
              onClick={() => handleViewEntry(entry)}
            >
              <Bookmark className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </Button>
            <Button
              variant="ghost"
              className="h-9 w-9 p-0 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:scale-105 transition-all"
              aria-label="Edit"
              onClick={() => handleEditEntry(entry)}
            >
              <Edit2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </Button>
            <Button
              variant="ghost"
              className="h-9 w-9 p-0 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-105 transition-all"
              aria-label="Delete"
              onClick={() => handleDeleteEntry(entry)}
            >
              <Trash2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </Button>
          </div>
        </div>
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view your moments.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-50 dark:bg-[#191919]">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#191919]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="w-full max-w-6xl mx-auto space-y-6">
            {filteredData.map(renderMomentCard)}

            {filteredData.length === 0 && (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                <p>No moments found matching your search.</p>
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter(null);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Entry View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry?.type === 'emotion' ? 'Emotion Log' : 
               selectedEntry?.type === 'journal' ? 'Journal Entry' :
               selectedEntry?.type === 'voice' ? 'Voice Note' :
               selectedEntry?.type === 'video' ? 'Video Entry' :
               selectedEntry?.type === 'photo' ? 'Photo Memory' :
               selectedEntry?.type === 'chat' ? 'AI Conversation' : 'Entry'} - {selectedEntry?.date.toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-6">
              {/* Main Content */}
              {selectedEntry.type === 'emotion' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Emotions</h3>
                    <p className="text-muted-foreground">
                      {selectedEntry.emotions?.join(', ') || 'No emotions recorded'}
                    </p>
                  </div>
                  
                  {selectedEntry.triggers && selectedEntry.triggers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Triggers</h3>
                      <p className="text-muted-foreground">{selectedEntry.triggers.join(', ')}</p>
                    </div>
                  )}
                  
                  {selectedEntry.context && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Context</h3>
                      <p className="text-muted-foreground">{selectedEntry.context}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Mood</h3>
                      <Badge variant="outline">{selectedEntry.mood}/6</Badge>
                    </div>
                    {selectedEntry.intensity !== undefined && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Intensity</h3>
                        <Badge variant="outline">{selectedEntry.intensity}/10</Badge>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Title</h3>
                    <p className="text-muted-foreground">{selectedEntry.title || 'Untitled'}</p>
                  </div>
                  
                  {selectedEntry.content && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Content</h3>
                      <div className="text-muted-foreground whitespace-pre-wrap p-4 bg-muted/50 rounded-lg">
                        {selectedEntry.content}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments Display */}
              {/* Video Files from Attachments */}
              {selectedEntry.entryType === 'video' && selectedEntry.attachments && selectedEntry.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Video Recording</h4>
                  {selectedEntry.attachments
                    .filter(url => url.includes('video_'))
                    .map((videoUrl, index) => (
                      <div key={index} className="bg-muted/50 rounded-lg p-4">
                        <video 
                          controls 
                          className="w-full max-h-96 rounded-lg"
                          preload="metadata"
                        >
                          <source src={videoUrl} type="video/webm" />
                          <source src={videoUrl} type="video/mp4" />
                          Your browser does not support the video element.
                        </video>
                      </div>
                    ))
                  }
                </div>
              )}
              
              {/* Photos */}
              {selectedEntry.carouselContent?.photos && selectedEntry.carouselContent.photos.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Photos ({selectedEntry.carouselContent.photos.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedEntry.carouselContent.photos.map((photo) => (
                      <div key={photo.id} className="space-y-2">
                        <div 
                          className="relative cursor-pointer group"
                          onClick={() => photo.url && setSelectedImage({url: photo.url, name: photo.name})}
                        >
                          {photo.url ? (
                            <img 
                              src={photo.url} 
                              alt={photo.name}
                              className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-sm">Loading...</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p className="truncate">{photo.name}</p>
                          {photo.caption && <p className="italic">"{photo.caption}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio Recordings */}
              {selectedEntry.carouselContent?.audioRecordings && selectedEntry.carouselContent.audioRecordings.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Audio Recordings ({selectedEntry.carouselContent.audioRecordings.length})</h4>
                  <div className="space-y-3">
                    {selectedEntry.carouselContent.audioRecordings.map((audio) => (
                      <div key={audio.id}>
                        {audio.audioUrl ? (
                          <LiquidAudioPlayer
                            audioUrl={audio.audioUrl}
                            title={audio.transcript || 'Audio Recording'}
                            createdAt={new Date(audio.createdAt)}
                            className="w-full"
                          />
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{audio.transcript || 'Audio Recording'}</span>
                              <Badge variant="outline">{Math.round(audio.duration)}s</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Audio file not available</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={selectedImage?.url || ''} 
              alt={selectedImage?.name || ''}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-3xl hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              ×
            </button>
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-sm bg-black/50 rounded px-2 py-1 inline-block">
                {selectedImage?.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}