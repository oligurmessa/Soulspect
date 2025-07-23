"use client"
import { Actionbar } from "@/components/actionbar"
import { useState } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { TextEditorWrapper as MinimalTextEditor } from "@/components/text_editor"
import AIVoiceTranscription from "@/components/ai-voice-transcription"
import { VideoRecorder } from "@/components/VideoRecorder"
import { useAuth } from "@/context/AuthContext"
import { saveJournalEntryWithFiles } from "@/lib/dbHelpers"
import { Timestamp } from "firebase/firestore"
import { toast } from "sonner"

export default function JournalPage() {
  const { user } = useAuth()
  const [showToolbar, setShowToolbar] = useState(false)
  const [title, setTitle] = useState("untitled")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMode, setSelectedMode] = useState<string>("Type")
  const [content, setContent] = useState<string>("")
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleVoiceTranscript = (transcript: string) => {
    setContent(transcript)
  }

  const handleVideoRecording = (videoBlob: Blob, duration: number) => {
    setVideoBlob(videoBlob)
    console.log("Video recorded:", videoBlob, duration)
  }

  const handleSaveJournal = async (saveAsDraft = false) => {
    if (!user) {
      toast.error("You must be logged in to save journal entries")
      return
    }

    if (!title.trim() && !content.trim() && !voiceBlob && !videoBlob) {
      toast.error("Please add some content before saving")
      return
    }

    setIsSaving(true)
    try {
      const entryType = selectedMode.toLowerCase() as 'text' | 'voice' | 'video'
      
      const entryData = {
        title: title.trim() || "Untitled Entry",
        content: content || "",
        entryType,
        isDraft: saveAsDraft,
        date: Timestamp.fromDate(selectedDate),
        attachments: [] as string[]
      }

      const files: { voiceBlob?: Blob; videoBlob?: Blob } = {}
      if (voiceBlob) files.voiceBlob = voiceBlob
      if (videoBlob) files.videoBlob = videoBlob

      await saveJournalEntryWithFiles(user.uid, entryData, files)
      
      toast.success(saveAsDraft ? "Draft saved successfully!" : "Journal entry saved successfully!")
      
      // Reset form for new entry
      setTitle("untitled")
      setContent("")
      setVoiceBlob(null)
      setVideoBlob(null)
      setSelectedDate(new Date())
      
    } catch (error) {
      console.error("Error saving journal entry:", error)
      toast.error("Failed to save journal entry. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleModeChange = (mode: string) => {
    setSelectedMode(mode)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Title, Calendar, and Save Actions */}
      <div className="flex-shrink-0 px-6 py-4 flex justify-between items-center border-b border-border">
        <input
          type="text"
          placeholder="untitled"
          className="text-2xl font-bold text-foreground bg-transparent border-none focus:outline-none w-full max-w-md"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex items-center gap-4">
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-6">
          {selectedMode === "Type" && (
            <div className="w-full max-w-3xl mx-auto">
              <MinimalTextEditor content={content} onContentChange={setContent} />
            </div>
          )}
          
          {selectedMode === "Voice" && (
            <div className="w-full max-w-3xl mx-auto">
              <AIVoiceTranscription
                onTranscriptComplete={handleVoiceTranscript}
              />
              
              {content && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Transcription:</h4>
                  <p className="text-sm">{content}</p>
                </div>
              )}
            </div>
          )}
          
          {selectedMode === "Video" && (
            <div className="w-full max-w-3xl mx-auto">
              <VideoRecorder onRecordingComplete={handleVideoRecording} />
            </div>
          )}
        </div>
      </div>

      {/* Actionbar */}
      <Actionbar 
        selectedMode={selectedMode}
        onModeChange={handleModeChange}
        onToolbarClick={() => setShowToolbar(!showToolbar)}
        onSave={() => handleSaveJournal(false)}
        title={title}
        content={content}
        voiceBlob={voiceBlob}
        videoBlob={videoBlob}
        selectedDate={selectedDate}
        user={user}
        isSaving={isSaving}
      />
    </div>
  )
}