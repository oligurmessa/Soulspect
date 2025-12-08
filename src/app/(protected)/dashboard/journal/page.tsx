"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LiquidAudioPlayer } from "@/components/liquid-audio-player";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { getEmotionLogs, getJournalEntries, type EmotionLog, type JournalEntry as DBJournalEntry } from "@/lib/dbHelpers";
import { MomentClient } from "@/lib/momentClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { JournalHeader } from "@/components/JournalHeader";
import { MomentCard, MomentEntry } from "@/components/MomentCard";

export default function JournalPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = React.useState<MomentEntry[]>([]);
  const [filteredData, setFilteredData] = React.useState<MomentEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<MomentEntry | null>(null);
  const [selectedImage, setSelectedImage] = React.useState<{ url: string, name: string } | null>(null);

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

          if (moments.length > 0) {
            combinedData = moments.map((moment: Record<string, any>) => ({
              id: (moment.id as string) || '',
              date: new Date(moment.timestamp as string),
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
              entryType: moment.journalData?.entryType as 'text' | 'voice' | 'video',
              isDraft: moment.journalData?.isDraft as boolean,
              context: moment.emotionData?.context as string,
              carouselContent: moment.carouselContent
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

    // Apply tag filter (which we use for type filtering now)
    if (activeFilter) {
      filtered = filtered.filter(entry =>
        entry.type === activeFilter || entry.entryType === activeFilter
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
    if (entry.type !== 'journal') {
      toast.error("Cannot edit emotion logs");
      return;
    }
    router.push('/dashboard/log?edit=' + entry.id);
  };

  const handleDeleteEntry = async (entry: MomentEntry) => {
    if (confirm("Are you sure you want to delete this moment?")) {
      try {
        // TODO: Implement actual delete call to MomentClient
        toast.success("Moment deleted");
        setData(data.filter(d => d.id !== entry.id));
      } catch (error) {
        toast.error("Failed to delete moment");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-zinc-50 dark:bg-[#191919]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-dvh bg-zinc-50 dark:bg-[#191919]">
        <p className="text-muted-foreground">Please log in to view your moments.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-zinc-50 dark:bg-[#191919]">
      <JournalHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalEntries={filteredData.length}
      />

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-4 pb-20">
          {filteredData.map(entry => (
            <MomentCard
              key={entry.id}
              entry={entry}
              onView={handleViewEntry}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />
          ))}

          {filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <SearchIcon className="w-8 h-8 text-zinc-400" />
              </div>
              <p className="text-zinc-900 dark:text-zinc-100 font-medium">No moments found</p>
              <p className="text-sm text-zinc-500 max-w-xs mt-1">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
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
                    {selectedEntry.carouselContent.photos.map((photo: any) => (
                      <div key={photo.id} className="space-y-2">
                        <div
                          className="relative cursor-pointer group"
                          onClick={() => photo.url && setSelectedImage({ url: photo.url, name: photo.name })}
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
                    {selectedEntry.carouselContent.audioRecordings.map((audio: any) => (
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

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}