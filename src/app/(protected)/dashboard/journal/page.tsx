"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LiquidAudioPlayer } from "@/components/liquid-audio-player";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import { useDataTable } from "@/hooks/use-data-table";
import type { Column, ColumnDef } from "@tanstack/react-table";

import {
  Smile,
  Frown,
  Meh,
  MoreHorizontal,
  Text,
  CalendarDays,
  Mic,
  Video,
  FileText,
} from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { getEmotionLogs, getJournalEntries, type EmotionLog, type JournalEntry as DBJournalEntry } from "@/lib/dbHelpers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface JournalHistoryEntry {
  id: string;
  date: string;
  type: 'emotion' | 'journal';
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

// Mock data removed - will be replaced with database fetches

export default function JournalHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [date] = useQueryState("date", parseAsString.withDefault(""));
  const [entryType] = useQueryState(
    "entryType",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  
  const [data, setData] = React.useState<JournalHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<JournalHistoryEntry | null>(null);
  const [selectedImage, setSelectedImage] = React.useState<{url: string, name: string} | null>(null);

  // Fetch data from database
  React.useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [emotionLogs, journalEntries] = await Promise.all([
          getEmotionLogs(user.uid, 100),
          getJournalEntries(user.uid, 100)
        ]);

        // Combine and transform data
        const combinedData: JournalHistoryEntry[] = [
          ...emotionLogs.map((log: EmotionLog) => ({
            id: log.id || '',
            date: log.createdAt.toDate().toISOString().split('T')[0],
            type: 'emotion' as const,
            mood: log.mood,
            emotions: log.emotions,
            triggers: log.triggers,
            context: log.context,
            intensity: log.intensity
          })),
          ...journalEntries.map((entry: DBJournalEntry) => ({
            id: entry.id || '',
            date: entry.date.toDate().toISOString().split('T')[0],
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

        // Sort by date descending
        combinedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setData(combinedData);
      } catch (error) {
        console.error('Error fetching journal history:', error);
        toast.error('Failed to load journal history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredData = React.useMemo(() => {
    return data.filter((entry) => {
      const matchesDate =
        date === "" || entry.date.toLowerCase().includes(date.toLowerCase());
      const matchesType =
        entryType.length === 0 || 
        (entry.type === 'journal' && entry.entryType && entryType.includes(entry.entryType)) ||
        (entry.type === 'emotion' && entryType.includes('emotion'));

      return matchesDate && matchesType;
    });
  }, [data, date, entryType]);

  const handleViewEntry = (entry: JournalHistoryEntry) => {
    setSelectedEntry(entry);
    setViewDialogOpen(true);
  };

  const handleEditEntry = (entry: JournalHistoryEntry) => {
    // Only allow editing journal entries, not emotion logs
    if (entry.type !== 'journal') {
      toast.error("Cannot edit emotion logs");
      return;
    }

    // Navigate to log page with new Firebase URL approach
    router.push('/dashboard/log?edit=' + entry.id);
  };

  const columns = React.useMemo<ColumnDef<JournalHistoryEntry>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "date",
        accessorKey: "date",
        header: ({ column }: { column: Column<JournalHistoryEntry, unknown> }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<JournalHistoryEntry["date"]>()}</div>,
        meta: {
          label: "Date",
          placeholder: "Search date...",
          variant: "text",
          icon: CalendarDays,
        },
        enableColumnFilter: true,
      },
      {
        id: "type",
        accessorKey: "type",
        header: ({ column }: { column: Column<JournalHistoryEntry, unknown> }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const entry = row.original;
          const Icon = entry.type === 'emotion' 
            ? (entry.mood !== undefined && entry.mood <= 2 ? Frown : entry.mood !== undefined && entry.mood >= 5 ? Smile : Meh)
            : entry.entryType === 'voice' ? Mic
            : entry.entryType === 'video' ? Video
            : FileText;

          const label = entry.type === 'emotion' 
            ? 'Emotion Log'
            : entry.entryType === 'voice' ? 'Voice Journal'
            : entry.entryType === 'video' ? 'Video Journal'
            : 'Text Journal';

          return (
            <Badge variant="outline" className="flex items-center gap-1">
              <Icon className="h-4 w-4" />
              {label}
            </Badge>
          );
        },
        meta: {
          label: "Type",
          variant: "multiSelect",
          options: [
            { label: "Emotion Log", value: "emotion", icon: Meh },
            { label: "Text Journal", value: "text", icon: FileText },
            { label: "Voice Journal", value: "voice", icon: Mic },
            { label: "Video Journal", value: "video", icon: Video },
          ],
        },
        enableColumnFilter: true,
      },
      {
        id: "content",
        accessorKey: "content",
        header: ({ column }: { column: Column<JournalHistoryEntry, unknown> }) => (
          <DataTableColumnHeader column={column} title="Content" />
        ),
        cell: ({ row }) => {
          const entry = row.original;
          let displayContent = '';
          let attachmentInfo = '';
          
          if (entry.type === 'emotion') {
            const emotionText = entry.emotions?.join(', ') || '';
            const triggerText = entry.triggers?.length ? ` (${entry.triggers.join(', ')})` : '';
            const contextText = entry.context ? ` - ${entry.context}` : '';
            displayContent = `${emotionText}${triggerText}${contextText}`;
          } else {
            displayContent = entry.title && entry.title !== 'untitled' && entry.title !== 'Untitled Entry'
              ? entry.title
              : entry.content?.substring(0, 100) + (entry.content && entry.content.length > 100 ? '...' : '') || '';
            
            // Add carousel content summary
            if (entry.carouselContent) {
              const { photos, emotions, audioRecordings } = entry.carouselContent;
              const attachments = [];
              if (photos?.length > 0) attachments.push(`${photos.length} photo${photos.length > 1 ? 's' : ''}`);
              if (emotions?.length > 0) attachments.push(`${emotions.length} emotion${emotions.length > 1 ? 's' : ''}`);
              if (audioRecordings?.length > 0) attachments.push(`${audioRecordings.length} audio${audioRecordings.length > 1 ? 's' : ''}`);
              
              if (attachments.length > 0) {
                attachmentInfo = ` • ${attachments.join(', ')}`;
              }
            }
          }
          
          return (
            <div className="line-clamp-2 text-sm">
              <div className="text-muted-foreground">
                {displayContent || 'No content'}
                {attachmentInfo && <span className="text-blue-600 font-medium">{attachmentInfo}</span>}
              </div>
              <div className="flex gap-1 mt-1">
                {entry.isDraft && <Badge variant="secondary" className="text-xs">Draft</Badge>}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: function Cell({ row }) {
          const entry = row.original;
          
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => handleViewEntry(entry)}
                  className="cursor-pointer"
                >
                  View
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleEditEntry(entry)}
                  className="cursor-pointer"
                  disabled={entry.type === 'emotion'}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 hover:bg-red-50">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 32,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "date", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.id,
  });

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
        <p className="text-muted-foreground">Please log in to view your journal history.</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div className="mb-4">
        <p className="text-muted-foreground">View your emotion logs and journal entries over time.</p>
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>

      {/* Entry View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry?.type === 'emotion' ? 'Emotion Log' : 'Journal Entry'} - {selectedEntry?.date}
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
              src={selectedImage.url} 
              alt={selectedImage.name}
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
                {selectedImage.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
