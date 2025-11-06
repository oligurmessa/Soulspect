// components/landing/logo_particles.tsx
"use client"

import { useEffect, useState } from "react"

export default function Component() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
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

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
      {/* Static logo */}
      <div className="absolute top-[48px] left-[180px] transform -translate-x-1/2 -translate-y-1/2">
        <img
          src="/clean_logo.png"
          alt="Soulspect Logo"
          className="w-10 h-10 md:w-[50px] md:h-[50px]"
        />
      </div>
      {/* Soulspect text positioned next to the logo */}
      <a
        href="https://soulspect.com"
        className={`absolute top-[18px] left-48 ${isDarkMode ? 'text-white' : 'text-gray-800'} text-4xl font-bold py-2 px-4 transition-colors hover:text-orange-300 pointer-events-auto`}
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