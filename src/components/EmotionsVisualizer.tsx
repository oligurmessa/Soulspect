"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"

import { Slider } from "@/components/ui/slider"

import { cn } from "@/lib/utils"

// Emotion definitions with enhanced properties

const emotions = [
  {
    name: "Very Unhappy",
    primaryColor: "#D94F45",
    secondaryColor: "#F2C5C0",
    waveAmplitude: 20,
    waveFrequency: 0.015,
    speed: 0.06,
    turbulence: 0.06,
    glow: 16,
    pulseIntensity: 0.16,
    spin: 0.0003,
    description: "Heavy, restless energy",
    category: "Intense",
    intensity: 8,
    valence: -0.6,
    arousal: 0.8,
  },
  {
    name: "Unhappy",
    primaryColor: "#C28B5B",
    secondaryColor: "#E5D2BC",
    waveAmplitude: 18,
    waveFrequency: 0.018,
    speed: 0.05,
    turbulence: 0.05,
    glow: 14,
    pulseIntensity: 0.13,
    spin: -0.0002,
    description: "Uneasy, low energy",
    category: "Negative",
    intensity: 6,
    valence: -0.4,
    arousal: 0.4,
  },
  {
    name: "Slightly Unhappy",
    primaryColor: "#4A82BF",
    secondaryColor: "#C3D7E8",
    waveAmplitude: 14,
    waveFrequency: 0.012,
    speed: 0.04,
    turbulence: 0.04,
    glow: 12,
    pulseIntensity: 0.09,
    spin: 0.00015,
    description: "Pensive, reflective",
    category: "Reflective",
    intensity: 4,
    valence: -0.1,
    arousal: -0.1,
  },
  {
    name: "Neutral",
    primaryColor: "#9797A2",
    secondaryColor: "#E3E3EA",
    waveAmplitude: 10,
    waveFrequency: 0.01,
    speed: 0.035,
    turbulence: 0.03,
    glow: 10,
    pulseIntensity: 0.07,
    spin: 0,
    description: "Calm and steady",
    category: "Neutral",
    intensity: 2,
    valence: 0,
    arousal: -0.2,
  },
  {
    name: "Slightly Happy",
    primaryColor: "#5EAC93",
    secondaryColor: "#C9E3DA",
    waveAmplitude: 16,
    waveFrequency: 0.013,
    speed: 0.05,
    turbulence: 0.04,
    glow: 14,
    pulseIntensity: 0.11,
    spin: 0.00015,
    description: "Light, peaceful",
    category: "Positive",
    intensity: 5,
    valence: 0.4,
    arousal: -0.1,
  },
  {
    name: "Happy",
    primaryColor: "#D97B45",
    secondaryColor: "#F2D9C7",
    waveAmplitude: 20,
    waveFrequency: 0.016,
    speed: 0.07,
    turbulence: 0.06,
    glow: 18,
    pulseIntensity: 0.16,
    spin: -0.00015,
    description: "Warm, bright energy",
    category: "Energetic",
    intensity: 6,
    valence: 0.6,
    arousal: 0.3,
  },
  {
    name: "Very Happy",
    primaryColor: "#8D62A6",
    secondaryColor: "#DCD0E3",
    waveAmplitude: 24,
    waveFrequency: 0.02,
    speed: 0.09,
    turbulence: 0.07,
    glow: 22,
    pulseIntensity: 0.22,
    spin: 0.0002,
    description: "Elevated, radiant",
    category: "Elevated",
    intensity: 7,
    valence: 0.8,
    arousal: 0.5,
  },
]

// Utility functions

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const normalizeToRgb = (
  color: string | { r: number; g: number; b: number }
): { r: number; g: number; b: number } => {
  if (typeof color === "string") {
    const r = Number.parseInt(color.slice(1, 3), 16)
    const g = Number.parseInt(color.slice(3, 5), 16)
    const b = Number.parseInt(color.slice(5, 7), 16)
    return { r, g, b }
  }
  return color
}

const lerpColor = (
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number
) => {
  const r = Math.round(lerp(color1.r, color2.r, t))
  const g = Math.round(lerp(color1.g, color2.g, t))
  const b = Math.round(lerp(color1.b, color2.b, t))
  return { r, g, b }
}

const colorToRgba = (color: string | { r: number; g: number; b: number }, alpha: number) => {
  const rgb = normalizeToRgb(color)
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

// Particle system

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

// Internal EmotionVisualizer - Renders the canvas

function EmotionVisualizerCanvas({ emotionValue }: { emotionValue: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const getCurrentEmotion = useCallback(() => {
    const value = emotionValue
    const index = Math.floor(value)
    const nextIndex = Math.min(index + 1, emotions.length - 1)
    const t = value - index
    return { current: emotions[index], next: emotions[nextIndex], blend: t }
  }, [emotionValue])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    updateDimensions()

    const observer = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (observer && containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !dimensions.width || !dimensions.height) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = dimensions
    const centerX = width / 2
    const centerY = height / 2
    const time = timeRef.current
    const { current, next, blend } = getCurrentEmotion()

    const blendedEmotion = {
      primaryColor: lerpColor(normalizeToRgb(current.primaryColor), normalizeToRgb(next.primaryColor), blend),
      secondaryColor: lerpColor(normalizeToRgb(current.secondaryColor), normalizeToRgb(next.secondaryColor), blend),
      waveAmplitude: lerp(current.waveAmplitude, next.waveAmplitude, blend),
      waveFrequency: lerp(current.waveFrequency, next.waveFrequency, blend),
      speed: lerp(current.speed, next.speed, blend),
      glow: lerp(current.glow, next.glow, blend),
      pulseIntensity: lerp(current.pulseIntensity, next.pulseIntensity, blend),
      turbulence: lerp(current.turbulence, next.turbulence, blend),
    }

    // Clear canvas with a soft fade for subtle motion trail
    ctx.save()
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = "rgba(0, 0, 0, 0.16)"
    ctx.fillRect(0, 0, width, height)
    ctx.restore()

    // Main Pulse
    const baseRadius = Math.min(width, height) / 5
    const pulseSize =
      baseRadius + Math.sin(time * 0.02) * blendedEmotion.pulseIntensity * baseRadius * 0.4

    // Particle generation (kept subtle)
    if (particlesRef.current.length < 18) {
      if (Math.random() < blendedEmotion.turbulence * 0.8) {
        const angle = Math.random() * Math.PI * 2
        const dist = pulseSize * (0.9 + Math.random() * 0.3)
        particlesRef.current.push({
          x: centerX + Math.cos(angle) * dist,
          y: centerY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * blendedEmotion.turbulence * 2,
          vy: (Math.random() - 0.5) * blendedEmotion.turbulence * 2,
          life: 1,
          maxLife: 90 + Math.random() * 70,
          size: 1.1 + Math.random() * 1.8,
        })
      }
    }

    particlesRef.current.forEach((p, i) => {
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.012
      p.size *= 0.99
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1)
        return
      }

      ctx.beginPath()
      ctx.fillStyle = colorToRgba(blendedEmotion.secondaryColor, p.life * 0.5)
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })

    // Main orb gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize * 2.2)
    gradient.addColorStop(0, colorToRgba(blendedEmotion.primaryColor, 0.85))
    gradient.addColorStop(0.5, colorToRgba(blendedEmotion.secondaryColor, 0.45))
    gradient.addColorStop(1, "rgba(0,0,0,0)")

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, pulseSize * 2.2, 0, Math.PI * 2)
    ctx.fill()

    // Outline wave ring
    ctx.save()
    ctx.globalCompositeOperation = "lighter"
    ctx.filter = `blur(${blendedEmotion.glow * 0.35}px)`
    ctx.strokeStyle = colorToRgba(blendedEmotion.primaryColor, 0.7)
    ctx.lineWidth = 1.8
    ctx.beginPath()
    for (let angle = 0; angle < Math.PI * 2; angle += 0.12) {
      const waveOffset =
        Math.sin(angle * 4 + time * blendedEmotion.waveFrequency * 18) *
        blendedEmotion.waveAmplitude *
        0.35
      const r = pulseSize + 10 + waveOffset
      const x = centerX + Math.cos(angle) * r
      const y = centerY + Math.sin(angle) * r
      if (angle === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.restore()

    timeRef.current += blendedEmotion.speed
  }, [dimensions, getCurrentEmotion])

  const animate = useCallback(() => {
    drawVisualization()
    animationRef.current = requestAnimationFrame(animate)
  }, [drawVisualization])

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      animate()
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate, dimensions])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[180px] sm:min-h-[220px] rounded-xl overflow-hidden bg-neutral-900/70 dark:bg-black/70"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/5 rounded-xl" />
    </div>
  )
}

// Main component that combines the visualizer and slider

interface EmotionVisualizerProps {
  onMoodChange?: (mood: number) => void
}

export default function EmotionVisualizer({ onMoodChange }: EmotionVisualizerProps) {
  const [emotionValue, setEmotionValue] = useState([3])
  const value = emotionValue[0]

  const handleValueChange = (newValue: number[]) => {
    setEmotionValue(newValue)
    onMoodChange?.(newValue[0])
  }

  const currentEmotionData = useMemo(() => {
    const index = Math.floor(value)
    const nextIndex = Math.min(index + 1, emotions.length - 1)
    const t = value - index
    const current = emotions[index]
    const next = emotions[nextIndex]

    const isCloserToCurrent = t < 0.5
    const active = isCloserToCurrent ? current : next

    return {
      name: active.name,
      description: active.description,
      category: active.category,
      index: isCloserToCurrent ? index : nextIndex,
    }
  }, [value])

  return (
    <div className="w-full flex flex-col gap-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-500">
            Current mood
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              {currentEmotionData.name}
            </h2>
            <span className="inline-flex items-center rounded-full border border-neutral-200/80 dark:border-neutral-700/80 px-2.5 py-0.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/70">
              {currentEmotionData.category}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
            {currentEmotionData.description}
          </p>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch">
        {/* Visual side */}
        <div className="sm:w-1/2 w-full">
          <EmotionVisualizerCanvas emotionValue={value} />
        </div>

        {/* Controls side */}
        <div className="sm:w-1/2 w-full flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Mood intensity</span>
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                {currentEmotionData.index + 1} / {emotions.length}
              </span>
            </div>
            <div className="relative pt-1 pb-6">
              <Slider
                value={emotionValue}
                onValueChange={handleValueChange}
                max={emotions.length - 1}
                step={0.05}
                className="w-full"
                trackClassName={cn(
                  "h-2 rounded-full bg-neutral-100 dark:bg-neutral-900/80",
                  "border border-neutral-200/80 dark:border-neutral-800"
                )}
                rangeClassName="rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400 dark:from-red-500 dark:via-amber-400 dark:to-emerald-400"
                thumbClassName={cn(
                  "h-5 w-5",
                  "bg-white dark:bg-neutral-950",
                  "border border-neutral-200 dark:border-neutral-700",
                  "shadow-sm hover:scale-110 transition-transform"
                )}
              />
              {/* Key anchors */}
              <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                <span>{emotions[0].name}</span>
                <span>{emotions[Math.floor(emotions.length / 2)].name}</span>
                <span className="text-right">{emotions[emotions.length - 1].name}</span>
              </div>
            </div>
          </div>

          {/* Emotion scale chips */}
          <div className="flex flex-wrap gap-1.5">
            {emotions.map((emotion, idx) => {
              const isActive = idx === currentEmotionData.index
              return (
                <button
                  key={emotion.name}
                  type="button"
                  onClick={() => handleValueChange([idx])}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs border transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 dark:focus-visible:ring-neutral-500/70",
                    isActive
                      ? "bg-neutral-900 text-neutral-50 border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100"
                      : "bg-white/60 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 border-neutral-200/80 dark:border-neutral-700/80 hover:bg-neutral-100/80 dark:hover:bg-neutral-800"
                  )}
                >
                  {emotion.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

