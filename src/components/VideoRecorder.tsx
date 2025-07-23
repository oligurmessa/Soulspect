"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface VideoRecorderProps {
  onRecordingComplete: (videoBlob: Blob, duration: number) => void
}

export function VideoRecorder({ onRecordingComplete }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      streamRef.current = stream
      setHasPermission(true)
      return true
    } catch (error) {
      console.error('Error accessing camera/microphone:', error)
      setHasPermission(false)
      return false
    }
  }

  const startRecording = async () => {
    if (hasPermission === null) {
      const granted = await requestPermission()
      if (!granted) return
    }

    if (!streamRef.current) {
      await requestPermission()
    }

    try {
      if (!streamRef.current) return
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })
      
      videoChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' })
        onRecordingComplete(videoBlob, recordingTime)
        
        // Create preview URL
        const url = URL.createObjectURL(videoBlob)
        setPreviewUrl(url)
        
        // Stop the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      }
      
      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
      setIsPaused(!isPaused)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const retakeVideo = async () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setRecordingTime(0)
    await requestPermission()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (hasPermission === false) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-red-600 text-2xl">videocam_off</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Camera Access Denied</h3>
            <p className="text-body mt-2">
              Please allow camera and microphone access in your browser settings to record video.
            </p>
          </div>
          <Button onClick={requestPermission} className="btn-primary">
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 p-6">
      {/* Video Preview/Playback */}
      <div className="relative w-full max-w-2xl">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
          {previewUrl ? (
            <video
              src={previewUrl}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">REC</span>
            </div>
          )}
          
          {isRecording && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full">
              <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="text-caption">
          {previewUrl 
            ? 'Video recorded successfully! Review and save, or retake.'
            : isRecording 
              ? isPaused 
                ? 'Recording paused' 
                : 'Recording in progress...' 
              : 'Ready to record your video journal entry'
          }
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4">
        {previewUrl ? (
          <>
            <Button onClick={retakeVideo} variant="ghost" className="btn-ghost px-6">
              <span className="material-symbols-outlined mr-2">refresh</span>
              Retake
            </Button>
            <Button 
              onClick={() => {
                // The video is already processed when recording stops
                // This button just confirms the user wants to keep it
              }} 
              className="btn-primary px-8"
            >
              <span className="material-symbols-outlined mr-2">check</span>
              Use This Video
            </Button>
          </>
        ) : !isRecording ? (
          <Button onClick={startRecording} className="btn-primary px-8">
            <span className="material-symbols-outlined mr-2">videocam</span>
            Start Recording
          </Button>
        ) : (
          <>
            <Button 
              onClick={pauseRecording} 
              variant="ghost" 
              className="btn-ghost px-6"
            >
              <span className="material-symbols-outlined mr-2">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button 
              onClick={stopRecording} 
              className="bg-red-500 hover:bg-red-600 text-white px-8"
            >
              <span className="material-symbols-outlined mr-2">stop</span>
              Stop Recording
            </Button>
          </>
        )}
      </div>

      {/* Tips */}
      {!previewUrl && (
        <div className="text-center max-w-md">
          <p className="text-caption">
            Position yourself in good lighting and speak clearly. Your video will be saved as part of your journal entry.
          </p>
        </div>
      )}
    </div>
  )
}