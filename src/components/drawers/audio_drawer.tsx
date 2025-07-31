"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import SmoothDrawer from "@/components/smooth_drawer";
import { Mic, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioDrawerProps {
    description?: string;
    onAudioRecorded?: (audioBlob: Blob, transcript?: string, title?: string) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

function AudioRecorder({ onRecordingComplete }: { onRecordingComplete?: (audioBlob: Blob) => void }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            // Clean up media recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                
                if (onRecordingComplete) {
                    onRecordingComplete(blob);
                }
            };
            
            mediaRecorderRef.current.start(100); // Record in 100ms chunks
            setIsRecording(true);
            setRecordingTime(0);
            
            // Start timer
            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="w-full py-4">
            <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-4">
                <button
                    className={cn(
                        "w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
                        isRecording 
                            ? "bg-red-500/10 hover:bg-red-500/20" 
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                    type="button"
                    onClick={handleToggleRecording}
                >
                    {isRecording ? (
                        <div className="w-6 h-6 rounded-sm bg-red-500 animate-pulse" />
                    ) : (
                        <Mic className="w-6 h-6 text-black/90 dark:text-white/90" />
                    )}
                </button>

                <span className="font-mono text-sm text-black/70 dark:text-white/70">
                    {formatTime(recordingTime)}
                </span>

                <p className="text-xs text-black/70 dark:text-white/70">
                    {isRecording ? "Recording... Click to stop" : "Click to speak"}
                </p>
            </div>
        </div>
    );
}

function AudioPlayer({ audioBlob }: { audioBlob: Blob }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioBlob) {
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            
            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [audioBlob]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        console.log('Setting up audio for drawer player:', audioUrl);
        audio.src = audioUrl;

        const updateDuration = () => {
            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                console.log('Duration found in drawer:', audio.duration);
                setDuration(audio.duration);
            }
        };

        const handleLoadedMetadata = () => {
            console.log('Loaded metadata in drawer, duration:', audio.duration);
            updateDuration();
        };

        const handleLoadedData = () => {
            console.log('Loaded data in drawer, duration:', audio.duration);
            updateDuration();
        };

        const handleCanPlay = () => {
            console.log('Can play in drawer, duration:', audio.duration);
            updateDuration();
        };

        const handleDurationChange = () => {
            console.log('Duration changed in drawer:', audio.duration);
            updateDuration();
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime || 0);
            // Sometimes duration is only available during playback
            if (duration === 0) {
                updateDuration();
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        // Add all event listeners
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('loadeddata', handleLoadedData);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        // Try multiple approaches to load duration
        audio.load();
        
        // Fallback: try to get duration periodically
        const durationCheckInterval = setInterval(() => {
            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                console.log('Duration found via interval in drawer:', audio.duration);
                setDuration(audio.duration);
                clearInterval(durationCheckInterval);
            }
        }, 100);

        // WebM duration workaround: try to seek to the end briefly
        const webmDurationFix = () => {
            if (duration === 0 && audio.readyState >= 2) {
                console.log('Trying WebM duration fix in drawer');
                const originalTime = audio.currentTime;
                audio.currentTime = 999999; // Try to seek to end
                setTimeout(() => {
                    if (audio.duration && isFinite(audio.duration)) {
                        console.log('WebM fix worked in drawer:', audio.duration);
                        setDuration(audio.duration);
                        audio.currentTime = originalTime;
                    }
                }, 50);
            }
        };

        // Try WebM fix after a short delay
        setTimeout(webmDurationFix, 500);

        // Clear interval after 5 seconds max
        setTimeout(() => clearInterval(durationCheckInterval), 5000);

        return () => {
            clearInterval(durationCheckInterval);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('loadeddata', handleLoadedData);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioUrl, duration]);

    const formatTime = (timeInSeconds: number) => {
        if (!isFinite(timeInSeconds) || isNaN(timeInSeconds)) {
            return "0:00";
        }
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const handlePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                await audio.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || duration === 0) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percent * duration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="w-full max-w-md space-y-3 mt-4">
            <audio ref={audioRef} preload="metadata" />
            
            {/* Progress Bar */}
            <div 
                className="relative h-2 w-full bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full cursor-pointer"
                onClick={handleSeek}
            >
                <div
                    className="absolute inset-y-0 left-0 bg-zinc-500 rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Time Display */}
            <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            {/* Play/Pause Button */}
            <div className="flex justify-center">
                <button
                    onClick={handlePlayPause}
                    className="p-3 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 rounded-lg transition-colors"
                    disabled={duration === 0}
                >
                    {isPlaying ? (
                        <Pause className="w-5 h-5" />
                    ) : (
                        <Play className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
}

export default function AudioDrawer({
    description = "Record your voice.",
    onAudioRecorded,
    open,
    onOpenChange,
}: AudioDrawerProps) {
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTitle, setRecordingTitle] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const handleRecordingComplete = (blob: Blob) => {
        setAudioBlob(blob);
    };

    const handleSave = () => {
        if (audioBlob && onAudioRecorded) {
            const title = recordingTitle.trim() || "Voice Recording";
            onAudioRecorded(audioBlob, undefined, title);
        }
        
        // Reset state
        setAudioBlob(null);
        setRecordingTitle("");
        
        // Close drawer
        if (onOpenChange) {
            onOpenChange(false);
        }
    };

    const handleCancel = () => {
        // Reset state
        setAudioBlob(null);
        setRecordingTitle("");
        
        // Close drawer
        if (onOpenChange) {
            onOpenChange(false);
        }
    };

    const actionButton = audioBlob ? (
        <Button onClick={handleSave} className="h-10 px-4 rounded-lg">
            Save
        </Button>
    ) : null;

    const titleElement = isEditing ? (
        <input
            type="text"
            value={recordingTitle}
            onChange={(e) => setRecordingTitle(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    setIsEditing(false);
                }
            }}
            placeholder="Voice Recording"
            className="bg-transparent border-none outline-none text-lg font-semibold w-full text-center"
            autoFocus
        />
    ) : (
        <div 
            onClick={() => setIsEditing(true)}
            className="text-lg font-semibold cursor-pointer hover:text-foreground/80 text-center"
        >
            {recordingTitle || "Voice Recording"}
        </div>
    );

    return (
        <SmoothDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={titleElement}
            description={description}
            showBackButton={true}
            onBackClick={handleCancel}
            backButtonText="Cancel"
            actionButton={actionButton}
            className="h-full"
        >
            <div className="flex flex-col items-center space-y-4 p-4">
                <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                {audioBlob && <AudioPlayer audioBlob={audioBlob} />}
            </div>
        </SmoothDrawer>
    );
}