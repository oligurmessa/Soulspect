"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/layouts/page-layout"

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onTranscriptChange?: (transcript: string) => void
}

export function VoiceRecorder({ onRecordingComplete, onTranscriptChange }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [transcript, setTranscript] = useState("")
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart
            } else {
              interimTranscript += transcriptPart
            }
          }
          
          const fullTranscript = transcript + finalTranscript + interimTranscript
          setTranscript(fullTranscript)
          onTranscriptChange?.(fullTranscript)
        }
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
        }
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [transcript, onTranscriptChange])

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setHasPermission(true)
      stream.getTracks().forEach(track => track.stop()) // Stop the initial stream
      return true
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setHasPermission(false)
      return false
    }
  }

  const startRecording = async () => {
    if (hasPermission === null) {
      const granted = await requestPermission()
      if (!granted) return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        onRecordingComplete(audioBlob, recordingTime)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
      
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        if (recognitionRef.current) {
          recognitionRef.current.start()
        }
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
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
      
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
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
            <span className="material-symbols-outlined text-red-600 text-2xl">mic_off</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Microphone Access Denied</h3>
            <p className="text-body mt-2">
              Please allow microphone access in your browser settings to use voice recording.
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
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-8">
      {/* Recording Visualization */}
      <div className="relative">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
          isRecording 
            ? 'neural-gradient animate-pulse shadow-lg shadow-primary/30' 
            : 'bg-muted hover:bg-muted/80'
        }`}>
          <span className={`material-symbols-outlined text-4xl ${
            isRecording ? 'text-white' : 'text-muted-foreground'
          }`}>
            {isRecording ? 'mic' : 'mic_none'}
          </span>
        </div>
        
        {isRecording && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="text-center">
        <div className="text-3xl font-mono font-bold">
          {formatTime(recordingTime)}
        </div>
        <p className="text-caption mt-1">
          {isRecording 
            ? isPaused 
              ? 'Recording paused' 
              : 'Recording...' 
            : 'Ready to record'
          }
        </p>
      </div>

      {/* Live Transcript */}
      {transcript && (
        <Card className="max-w-md p-4">
          <h4 className="font-medium mb-2">Live Transcript:</h4>
          <p className="text-body text-sm">{transcript}</p>
        </Card>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4">
        {!isRecording ? (
          <Button onClick={startRecording} className="btn-primary px-8">
            <span className="material-symbols-outlined mr-2">mic</span>
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
              Stop & Save
            </Button>
          </>
        )}
      </div>

      {/* Tips */}
      <div className="text-center max-w-md">
        <p className="text-caption">
          Speak clearly and naturally. Your voice will be automatically transcribed as you speak.
        </p>
      </div>
    </div>
  )
}

