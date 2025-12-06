"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, X, RotateCcw, Check, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CameraModalProps {
    isOpen: boolean
    onClose: () => void
    onPhotoTaken: (file: File) => void
}

export function CameraModal({ isOpen, onClose, onPhotoTaken }: CameraModalProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = React.useState<MediaStream | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [capturedImage, setCapturedImage] = React.useState<string | null>(null)
    const [isInitializing, setIsInitializing] = React.useState(false)

    // Initialize camera when modal opens
    React.useEffect(() => {
        if (isOpen) {
            startCamera()
        } else {
            stopCamera()
        }
        return () => stopCamera()
    }, [isOpen])

    const startCamera = async () => {
        setIsInitializing(true)
        setError(null)
        setCapturedImage(null)

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            setError("Unable to access camera. Please check permissions.")
        } finally {
            setIsInitializing(false)
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            setStream(null)
        }
        setCapturedImage(null)
    }

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            const context = canvas.getContext("2d")

            if (context) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight

                // Flip horizontally if using user-facing camera (mirror effect)
                context.translate(canvas.width, 0)
                context.scale(-1, 1)

                context.drawImage(video, 0, 0, canvas.width, canvas.height)

                const imageUrl = canvas.toDataURL("image/jpeg", 0.9)
                setCapturedImage(imageUrl)
            }
        }
    }

    const handleRetake = () => {
        setCapturedImage(null)
    }

    const handleUsePhoto = async () => {
        if (capturedImage) {
            try {
                const res = await fetch(capturedImage)
                const blob = await res.blob()
                const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" })
                onPhotoTaken(file)
                onClose()
            } catch (err) {
                console.error("Error processing photo:", err)
                setError("Failed to process photo")
            }
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-3xl h-full sm:h-auto sm:aspect-video bg-black sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                    >
                        {/* Header / Close Button */}
                        <div className="absolute top-4 right-4 z-20">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-white hover:bg-white/20 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 relative flex items-center justify-center bg-zinc-900">
                            {error ? (
                                <div className="text-center p-6">
                                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                    <p className="text-white font-medium">{error}</p>
                                    <Button onClick={startCamera} variant="outline" className="mt-4">
                                        Try Again
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Video Feed */}
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className={cn(
                                            "absolute inset-0 w-full h-full object-cover transform -scale-x-100",
                                            capturedImage ? "hidden" : "block"
                                        )}
                                    />

                                    {/* Captured Image Preview */}
                                    {capturedImage && (
                                        <img
                                            src={capturedImage}
                                            alt="Captured"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    )}

                                    {/* Loading State */}
                                    {isInitializing && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                                        </div>
                                    )}

                                    {/* Hidden Canvas for Capture */}
                                    <canvas ref={canvasRef} className="hidden" />
                                </>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-8">
                            {!capturedImage ? (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={takePhoto}
                                    disabled={isInitializing || !!error}
                                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white" />
                                </motion.button>
                            ) : (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        onClick={handleRetake}
                                        className="rounded-full px-6 gap-2"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Retake
                                    </Button>
                                    <Button
                                        size="lg"
                                        onClick={handleUsePhoto}
                                        className="rounded-full px-6 gap-2 bg-white text-black hover:bg-white/90"
                                    >
                                        <Check className="w-4 h-4" />
                                        Use Photo
                                    </Button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
