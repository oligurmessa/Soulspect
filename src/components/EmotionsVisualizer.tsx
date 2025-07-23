"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"

// Emotion definitions with enhanced properties
const emotions = [
  {
    name: "Very Unhappy",
    primaryColor: "#D94F45",
    secondaryColor: "#F2C5C0",
    waveAmplitude: 25,
    waveFrequency: 0.02,
    speed: 0.1,
    turbulence: 0.1,
    glow: 20,
    pulseIntensity: 0.2,
    spin: 0.0003,
    description: "Restless, unsettled energy",
    category: "Intense",
    intensity: 8,
    valence: -0.6,
    arousal: 0.8
  },
  {
    name: "Unhappy",
    primaryColor: "#A68A56",
    secondaryColor: "#E0D8C3",
    waveAmplitude: 30,
    waveFrequency: 0.025,
    speed: 0.08,
    turbulence: 0.15,
    glow: 18,
    pulseIntensity: 0.15,
    spin: -0.0002,
    description: "Uneasy, troubled feelings",
    category: "Negative",
    intensity: 6,
    valence: -0.4,
    arousal: 0.4
  },
  {
    name: "Slightly Unhappy",
    primaryColor: "#4A82BF",
    secondaryColor: "#C3D7E8",
    waveAmplitude: 15,
    waveFrequency: 0.01,
    speed: 0.04,
    turbulence: 0.05,
    glow: 15,
    pulseIntensity: 0.08,
    spin: 0.00015,
    description: "Thoughtful, contemplative state",
    category: "Reflective",
    intensity: 4,
    valence: 0.1,
    arousal: -0.2
  },
  {
    name: "Neutral",
    primaryColor: "#A9A9B3",
    secondaryColor: "#E8E8ED",
    waveAmplitude: 8,
    waveFrequency: 0.005,
    speed: 0.02,
    turbulence: 0.02,
    glow: 8,
    pulseIntensity: 0.04,
    spin: 0,
    description: "Calm, centered presence",
    category: "Neutral",
    intensity: 2,
    valence: 0,
    arousal: -0.6
  },
  {
    name: "Slightly Happy",
    primaryColor: "#5EAC93",
    secondaryColor: "#C9E3DA",
    waveAmplitude: 20,
    waveFrequency: 0.008,
    speed: 0.05,
    turbulence: 0.04,
    glow: 15,
    pulseIntensity: 0.1,
    spin: 0.0001,
    description: "Peaceful, harmonious feeling",
    category: "Positive",
    intensity: 5,
    valence: 0.6,
    arousal: -0.3
  },
  {
    name: "Happy",
    primaryColor: "#D97B45",
    secondaryColor: "#F2D9C7",
    waveAmplitude: 22,
    waveFrequency: 0.012,
    speed: 0.07,
    turbulence: 0.06,
    glow: 20,
    pulseIntensity: 0.12,
    spin: -0.0001,
    description: "Warm, glowing energy",
    category: "Energetic",
    intensity: 6,
    valence: 0.4,
    arousal: 0.3
  },
  {
    name: "Very Happy",
    primaryColor: "#8D62A6",
    secondaryColor: "#DCD0E3",
    waveAmplitude: 30,
    waveFrequency: 0.015,
    speed: 0.12,
    turbulence: 0.08,
    glow: 25,
    pulseIntensity: 0.25,
    spin: 0.00025,
    description: "Radiant, transcendent state",
    category: "Elevated",
    intensity: 7,
    valence: 0.8,
    arousal: 0.5
  },
]

// Utility functions
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const normalizeToRgb = (color: string | { r: number; g: number; b: number }): { r: number; g: number; b: number } => {
  if (typeof color === "string") {
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    return { r, g, b };
  }
  return color;
}
const lerpColor = (
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number
) => {
  const r = Math.round(lerp(color1.r, color2.r, t));
  const g = Math.round(lerp(color1.g, color2.g, t));
  const b = Math.round(lerp(color1.b, color2.b, t));
  return { r, g, b };
}
const colorToRgba = (color: string | { r: number; g: number; b: number }, alpha: number) => {
  const rgb = normalizeToRgb(color);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

// Internal EmotionVisualizer - Renders the canvas
function EmotionVisualizerCanvas({ emotionValue }: { emotionValue: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef(0)
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
        });
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      if (observer && containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions.width || !dimensions.height) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const time = timeRef.current;
  
    const { current, next, blend } = getCurrentEmotion();
  
    const blendedEmotion = {
      primaryColor: lerpColor(normalizeToRgb(current.primaryColor), normalizeToRgb(next.primaryColor), blend),
      secondaryColor: lerpColor(normalizeToRgb(current.secondaryColor), normalizeToRgb(next.secondaryColor), blend),
      waveAmplitude: lerp(current.waveAmplitude, next.waveAmplitude, blend),
      waveFrequency: lerp(current.waveFrequency, next.waveFrequency, blend),
      speed: lerp(current.speed, next.speed, blend),
      glow: lerp(current.glow, next.glow, blend),
      pulseIntensity: lerp(current.pulseIntensity, next.pulseIntensity, blend),
    };
  
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, width, height);
  
    const pulseSize = (Math.min(width, height) / 6) + Math.sin(time * 0.02) * blendedEmotion.pulseIntensity * 20;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize * 2.5);
    gradient.addColorStop(0, colorToRgba(blendedEmotion.primaryColor, 0.4));
    gradient.addColorStop(0.5, colorToRgba(blendedEmotion.secondaryColor, 0.2));
    gradient.addColorStop(1, "transparent");
  
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize * 2.5, 0, Math.PI * 2);
    ctx.fill();
  
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.filter = `blur(${blendedEmotion.glow}px)`;
    for (let i = 0; i < 2; i++) {
        ctx.strokeStyle = colorToRgba(blendedEmotion.primaryColor, 0.2);
        ctx.lineWidth = 1 + i * 2;
        ctx.beginPath();
        const waveRadius = pulseSize + 20 + i * 15 + Math.sin(time * 0.01 + i) * 5;
        for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
            const waveOffset = Math.sin(angle * 5 + time * blendedEmotion.waveFrequency * 20) * blendedEmotion.waveAmplitude * 0.2;
            const r = waveRadius + waveOffset;
            ctx.lineTo(centerX + Math.cos(angle) * r, centerY + Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
  
    timeRef.current += blendedEmotion.speed;
  }, [dimensions, getCurrentEmotion]);
  
  const animate = useCallback(() => {
    drawVisualization();
    animationRef.current = requestAnimationFrame(animate);
  }, [drawVisualization]);

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      animate();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, dimensions]);
  
  const { current: currentEmotion, blend } = getCurrentEmotion();
  const blendedPrimaryColor = useMemo(() => {
    const nextEmotion = emotions[Math.min(Math.floor(emotionValue) + 1, emotions.length - 1)];
    return colorToRgba(lerpColor(normalizeToRgb(currentEmotion.primaryColor), normalizeToRgb(nextEmotion.primaryColor), blend), 1);
  }, [currentEmotion, blend, emotionValue]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0" />
      <div
        className="absolute inset-0 opacity-30 mix-blend-soft-light"
        style={{ background: `radial-gradient(circle at center, ${blendedPrimaryColor} 0%, transparent 70%)` }}
      />
    </div>
  );
}

// Main component that combines the visualizer and slider
interface EmotionVisualizerProps {
  onMoodChange?: (mood: number) => void;
}

export default function EmotionVisualizer({ onMoodChange }: EmotionVisualizerProps) {
  const [emotionValue, setEmotionValue] = useState([3]);
  const value = emotionValue[0];

  const handleValueChange = (newValue: number[]) => {
    setEmotionValue(newValue);
    onMoodChange?.(newValue[0]);
  };

  const currentEmotionData = useMemo(() => {
    const index = Math.floor(value);
    const nextIndex = Math.min(index + 1, emotions.length - 1);
    const t = value - index;
    const current = emotions[index];
    const next = emotions[nextIndex];
    return { name: t < 0.5 ? current.name : next.name };
  }, [value]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white font-sans antialiased">
      <div className="relative w-full flex-1 rounded-lg overflow-hidden">
        <EmotionVisualizerCanvas emotionValue={value} />
      </div>
      <div className="w-full max-w-sm">
        <div className="space-y-2">
          <h2 className="text-white/90 font-semibold text-base text-center">
            {currentEmotionData.name}
          </h2>
              <Slider
                value={emotionValue}
                onValueChange={handleValueChange}
                max={emotions.length - 1}
                step={0.05}
                className="w-full"
                // Custom classes for the slider's aesthetic - White Line and Knob
                trackClassName="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 shadow-inner"
                rangeClassName="absolute h-full bg-gray-200" // Matches track color for continuous line
                thumbClassName="block h-5 w-5 rounded-full border border-gray-300 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
                />
          <div className="flex justify-between text-xs text-white/50 px-1">
            <span className="text-left select-none">Very Unhappy</span>
            <span className="text-center select-none">Neutral</span>
            <span className="text-right select-none">Very Happy</span>
          </div>
        </div>
      </div>
    </div>
  );
}