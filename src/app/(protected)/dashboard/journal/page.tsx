"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiquidAudioPlayer } from "@/components/liquid-audio-player";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import {
  Smile,
  Frown,
  Meh,
  Search,
  Heart,
  MessageSquare,
  Mic,
  Video,
  FileText,
  ImageIcon,
  Clock,
  Edit,
  SlidersHorizontal,
} from "lucide-react";
import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { getEmotionLogs, getJournalEntries, type EmotionLog, type JournalEntry as DBJournalEntry } from "@/lib/dbHelpers";
import { MomentClient } from "@/lib/momentClient";
import { type Moment } from "@/lib/moments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

type FilterType = 'all' | 'journal' | 'emotion' | 'voice' | 'photo' | 'video' | 'chat';
type SortType = 'newest' | 'oldest' | 'mood-high' | 'mood-low';
type ViewMode = 'timeline' | 'grid' | 'list';

export default function MomentsPage() {
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
  const [filterType, setFilterType] = React.useState<FilterType>('all');
  const [sortType, setSortType] = React.useState<SortType>('newest');
  const [viewMode] = React.useState<ViewMode>('timeline');
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedMood, setSelectedMood] = React.useState<number | null>(null);

  // Fetch data from database - prioritize moments, fallback to legacy
  React.useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        let combinedData: MomentEntry[] = [];
        
        // Try to get moments first (new unified structure)
        try {
          const moments = await MomentClient.getMoments(user.uid, { limit: 200 });
          
          if (moments.length > 0) {
            console.log(`Found ${moments.length} moments, using new structure`);
            combinedData = moments.map((moment: Moment) => ({
              id: moment.id || '',
              date: moment.timestamp.toDate(),
              type: moment.type,
              title: moment.title,
              content: moment.content,
              mood: moment.mood,
              emotions: moment.emotions,
              triggers: moment.triggers,
              intensity: moment.intensity,
              attachments: moment.attachments,
              tags: moment.tags,
              location: moment.location,
              weather: moment.weather,
              // Map journal-specific data
              entryType: moment.journalData?.entryType,
              isDraft: moment.journalData?.isDraft,
              // Map emotion-specific data
              context: moment.emotionData?.context,
            }));
          }
        } catch (momentError) {
          console.log('No moments found, falling back to legacy data');
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

  // Filter and sort data
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

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType);
    }

    // Apply mood filter
    if (selectedMood !== null) {
      filtered = filtered.filter(entry => entry.mood === selectedMood);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'oldest':
          return a.date.getTime() - b.date.getTime();
        case 'mood-high':
          return (b.mood || 0) - (a.mood || 0);
        case 'mood-low':
          return (a.mood || 0) - (b.mood || 0);
        case 'newest':
        default:
          return b.date.getTime() - a.date.getTime();
      }
    });

    setFilteredData(filtered);
  }, [data, searchQuery, filterType, selectedMood, sortType]);

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

  const getTypeIcon = (entry: MomentEntry) => {
    switch (entry.type) {
      case 'emotion':
        return entry.mood !== undefined && entry.mood <= 2 ? Frown : 
               entry.mood !== undefined && entry.mood >= 5 ? Smile : Meh;
      case 'voice':
        return Mic;
      case 'video':
        return Video;
      case 'photo':
        return ImageIcon;
      case 'chat':
        return MessageSquare;
      default:
        return FileText;
    }
  };

  const getTypeLabel = (entry: MomentEntry) => {
    switch (entry.type) {
      case 'emotion':
        return 'Emotion Log';
      case 'voice':
        return 'Voice Note';
      case 'video':
        return 'Video Entry';
      case 'photo':
        return 'Photo Memory';
      case 'chat':
        return 'AI Chat';
      case 'journal':
        return entry.entryType === 'voice' ? 'Voice Journal' : 
               entry.entryType === 'video' ? 'Video Journal' : 'Text Journal';
      default:
        return 'Entry';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const groupMomentsByDate = (moments: MomentEntry[]) => {
    const groups: { [key: string]: MomentEntry[] } = {};
    
    moments.forEach(moment => {
      const dateKey = moment.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(moment);
    });
    
    return Object.entries(groups).map(([date, moments]) => ({
      date: new Date(date),
      moments: moments.sort((a, b) => b.date.getTime() - a.date.getTime())
    }));
  };

  // Component rendering helpers
  const renderMomentCard = (entry: MomentEntry) => {
    const TypeIcon = getTypeIcon(entry);
    const hasMedia = entry.attachments?.length || entry.carouselContent?.photos?.length || 
                     entry.carouselContent?.audioRecordings?.length;
    
    return (
      <Card key={entry.id} className="hover:bg-accent/50 transition-colors cursor-pointer group" 
            onClick={() => handleViewEntry(entry)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                entry.type === 'emotion' ? "bg-red-100 text-red-600" :
                entry.type === 'journal' ? "bg-blue-100 text-blue-600" :
                entry.type === 'voice' ? "bg-green-100 text-green-600" :
                entry.type === 'video' ? "bg-purple-100 text-purple-600" :
                entry.type === 'photo' ? "bg-yellow-100 text-yellow-600" :
                "bg-gray-100 text-gray-600"
              )}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(entry)}
                  </Badge>
                  {entry.isDraft && (
                    <Badge variant="secondary" className="text-xs">Draft</Badge>
                  )}
                  {hasMedia && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                      Media
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatRelativeTime(entry.date)}</span>
                  {entry.mood !== undefined && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <Heart className={cn(
                        "w-4 h-4",
                        entry.mood >= 4 ? "text-green-500" :
                        entry.mood >= 3 ? "text-yellow-500" : "text-red-500"
                      )} />
                      <span>{entry.mood}/6</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {entry.type === 'journal' && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEntry(entry);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {entry.title && (
            <h3 className="font-medium mb-2 line-clamp-1">{entry.title}</h3>
          )}
          
          {entry.type === 'emotion' ? (
            <div className="space-y-2">
              {entry.emotions && entry.emotions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.emotions.slice(0, 3).map((emotion) => (
                    <Badge key={emotion} variant="secondary" className="text-xs">
                      {emotion}
                    </Badge>
                  ))}
                  {entry.emotions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{entry.emotions.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              {entry.context && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.context}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {entry.content && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {entry.content}
                </p>
              )}
              
              {/* Media previews */}
              {entry.carouselContent?.photos && entry.carouselContent.photos.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {entry.carouselContent.photos.slice(0, 3).map((photo) => (
                    <div key={photo.id} className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                      {photo.url && (
                        <img 
                          src={photo.url} 
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {entry.carouselContent.photos.length > 3 && (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-muted-foreground">
                      +{entry.carouselContent.photos.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {entry.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {entry.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{entry.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
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

  const groupedMoments = groupMomentsByDate(filteredData);

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-2xl font-semibold">Your Moments</h1>
            <p className="text-muted-foreground">
              {filteredData.length} {filteredData.length === 1 ? 'moment' : 'moments'} captured
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 space-y-4 border-b">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search moments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Tabs value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="journal" className="text-xs">Journal</TabsTrigger>
                    <TabsTrigger value="emotion" className="text-xs">Emotion</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort</label>
                <Tabs value={sortType} onValueChange={(value) => setSortType(value as SortType)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="newest" className="text-xs">Newest</TabsTrigger>
                    <TabsTrigger value="oldest" className="text-xs">Oldest</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Mood Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Mood</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((mood) => (
                    <Button
                      key={mood}
                      variant={selectedMood === mood ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
                      className="w-8 h-8 p-0 text-xs"
                    >
                      {mood}
                    </Button>
                  ))}
                  {selectedMood && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMood(null)}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No moments found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Start capturing your moments in the Log page'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => router.push('/dashboard/log')}>
                    Create Your First Moment
                  </Button>
                )}
              </div>
            ) : viewMode === 'timeline' ? (
              /* Timeline View */
              <div className="space-y-8">
                {groupedMoments.map(({ date, moments }) => (
                  <div key={date.toDateString()} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-background border rounded-lg px-3 py-1">
                        <span className="text-sm font-medium">
                          {formatRelativeTime(date)}
                        </span>
                      </div>
                      <Separator className="flex-1" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {moments.map(renderMomentCard)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Grid View */
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredData.map(renderMomentCard)}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

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
                  
                  <div className="flex gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Type</h3>
                      <Badge variant="outline" className="capitalize">{selectedEntry.entryType}</Badge>
                    </div>
                    {selectedEntry.isDraft && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Status</h3>
                        <Badge variant="secondary">Draft</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Carousel Content */}
              {(selectedEntry.carouselContent || (selectedEntry.attachments && selectedEntry.attachments.length > 0)) && (
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-semibold">Attached Content</h3>
                  
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
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                              </div>
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

                  {/* Emotions */}
                  {selectedEntry.carouselContent?.emotions && selectedEntry.carouselContent.emotions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Emotion Logs ({selectedEntry.carouselContent.emotions.length})</h4>
                      <div className="space-y-3">
                        {selectedEntry.carouselContent.emotions.map((emotion) => (
                          <div key={emotion.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{emotion.emotion}</span>
                              <Badge variant="outline">Intensity: {emotion.intensity}</Badge>
                            </div>
                            {emotion.note && (
                              <p className="text-sm text-muted-foreground mb-2">"{emotion.note}"</p>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {emotion.emotions?.length > 0 && (
                                <p>Emotions: {emotion.emotions.join(', ')}</p>
                              )}
                              {emotion.triggers?.length > 0 && (
                                <p>Triggers: {emotion.triggers.join(', ')}</p>
                              )}
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
                        {selectedEntry.carouselContent.audioRecordings.map((audio) => {
                          console.log('Audio item in view dialog:', audio);
                          console.log('Audio URL exists:', !!audio.audioUrl);
                          console.log('Audio URL value:', audio.audioUrl);
                          
                          return (
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
                          );
                        })}
                      </div>
                    </div>
                  )}
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
    </>
  );
}
