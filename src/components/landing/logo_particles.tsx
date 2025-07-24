// components/landing/logo_particles.tsx
"use client"

import { useRef, useEffect, useState } from "react"

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      setIsMobile(window.innerWidth < 768) // Set mobile breakpoint
    }

    // Check theme on mount and when class changes
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }

    checkTheme()

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    updateCanvasSize()

    let particles: {
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      color: string
      scatteredColor: string
      life: number
      isAWS: boolean
    }[] = []

    let textImageData: ImageData | null = null

const coolColors = [
  "#ff9066", // Primary soft orange
  "#FFE8D6", // Creamy beige (background or light fill)
  "#F7C59F", // Sand tan (tone-on-tone warmth)
  "#ff9066", // Primary soft orange
  
];


    function createTextImage() {
      if (!ctx || !canvas) return

      ctx.fillStyle = "white"
      ctx.save()

      const logoSize = isMobile ? 40 : 50 // Slightly smaller logo size

      // --- CHANGE START ---
      // Instead of centering, define fixed top-left coordinates.
      // These values position the logo to align nicely with your fixed tabs.
      const logoX = 180; 
      const logoY = 48;
      // --- CHANGE END ---

      const logoImage = new Image()
      logoImage.crossOrigin = "anonymous"
      logoImage.onload = () => {
        ctx.save()

        // --- CHANGE START ---
        // Use the new coordinates for translation, ensuring the logo is centered on (logoX, logoY)
        ctx.translate(logoX - logoSize / 2, logoY - logoSize / 2)
        // --- CHANGE END ---
        
        ctx.drawImage(logoImage, 0, 0, logoSize, logoSize)
        ctx.restore()

        textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        createInitialParticles()
        animate()
      }

      logoImage.src = "/logo.png"

      ctx.restore()
    }

    function createParticle() {
      if (!ctx || !canvas || !textImageData) return null

      const data = textImageData.data

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width)
        const y = Math.floor(Math.random() * canvas.height)

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          const randomColor = coolColors[Math.floor(Math.random() * coolColors.length)]
          return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: Math.random() * 1 + 0.5,
            color: "white",
            scatteredColor: randomColor,
            isAWS: false,
            life: Math.random() * 100 + 50,
          }
        }
      }

      return null
    }

    function createInitialParticles() {
      if (!canvas) return
      const baseParticleCount = 7000
      const particleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)))
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle()
        if (particle) particles.push(particle)
      }
    }

    let animationFrameId: number

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const { x: mouseX, y: mouseY } = mousePositionRef.current
      const maxDistance = 80

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance && (isTouchingRef.current || !("ontouchstart" in window))) {
          const force = (maxDistance - distance) / maxDistance
          const angle = Math.atan2(dy, dx)
          const moveX = Math.cos(angle) * force * 20
          const moveY = Math.sin(angle) * force * 20
          p.x = p.baseX - moveX
          p.y = p.baseY - moveY

          ctx.fillStyle = p.scatteredColor
        } else {
          p.x += (p.baseX - p.x) * 0.05
          p.y += (p.baseY - p.y) * 0.05
          ctx.fillStyle = isDarkMode ? "white" : "black"
        }

        ctx.fillRect(p.x, p.y, p.size, p.size)

        p.life--
        if (p.life <= 0) {
          const newParticle = createParticle()
          if (newParticle) {
            particles[i] = newParticle
          } else {
            particles.splice(i, 1)
            i--
          }
        }
      }

      const baseParticleCount = 7000
      const targetParticleCount = Math.floor(
        baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)),
      )
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle()
        if (newParticle) particles.push(newParticle)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    createTextImage()

    const handleResize = () => {
      updateCanvasSize()
      particles = []
      createTextImage()
    }

    const handleMove = (x: number, y: number) => {
      mousePositionRef.current = { x, y }
    }
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault()
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const handleTouchStart = () => { isTouchingRef.current = true }
    const handleTouchEnd = () => {
      isTouchingRef.current = false
      mousePositionRef.current = { x: 0, y: 0 }
    }
    const handleMouseLeave = () => {
      if (!("ontouchstart" in window)) mousePositionRef.current = { x: 0, y: 0 }
    }

    window.addEventListener("resize", handleResize)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("mouseleave", handleMouseLeave)
    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("resize", handleResize)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchend", handleTouchEnd)
      observer.disconnect()
      cancelAnimationFrame(animationFrameId)
    }
  }, [isMobile, isDarkMode])

  return (
    <div className="fixed top-0 left-0 w-full h-full z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        aria-label="Interactive particle effect of a logo"
      />
      {/* Soulspect text positioned next to the particle logo */}
      <a
        href="https://soulspect.com"
        className={`absolute top-[18px] left-48 ${isDarkMode ? 'text-white' : 'text-gray-800'} text-4xl font-bold py-2 px-4 transition-colors hover:text-orange-300`}
        style={{ 
          textShadow: '0 0 10px rgba(255, 144, 102, 0.7)',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700
        }}
      >
        soulspect
      </a>
    </div>
  )
}