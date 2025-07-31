// tabs.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useState, useRef, useEffect } from "react"

const tabs = ["Features", "Analytics", "Soulspace", "Pricing", "About"]

export default function Frame() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoverStyle, setHoverStyle] = useState({})
  const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" })
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    
    requestAnimationFrame(() => {
      const overviewElement = tabRefs.current[0]
      if (overviewElement) {
        const { offsetLeft, offsetWidth } = overviewElement
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    })
  }, [])
  
  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex]
      if (hoveredElement) {
        setHoverStyle({
          left: `${hoveredElement.offsetLeft}px`,
          width: `${hoveredElement.offsetWidth}px`,
        })
      }
    }
  }, [hoveredIndex])

  useEffect(() => {
    const activeElement = tabRefs.current[activeIndex]
    if (activeElement) {
      setActiveStyle({
        left: `${activeElement.offsetLeft}px`,
        width: `${activeElement.offsetWidth}px`,
      })
    }
  }, [activeIndex])


  return (
    <header 
      className="
        fixed 
        top-4 
        left-1/2 
        -translate-x-1/2 
        z-50 
        w-auto
      "
    >
      {/* The Glassy Panel is now part of this component */}
      <div 
        className="
          flex 
          items-center 
          justify-center 
          p-2 
          bg-white/50 
          dark:bg-black/30 
          backdrop-blur-lg 
          rounded-xl 
          border 
          border-white/20
          dark:border-black/20
          shadow-lg
        "
      >
        {/* The original Card and its contents are placed inside the glass panel */}
        <Card className="border-none shadow-none relative flex items-center justify-center bg-transparent">
          <CardContent className="p-0">
            <div className="relative">
              <div
                className="absolute h-[30px] transition-all duration-300 ease-out bg-[#0e0f1114] dark:bg-[#ffffff1a] rounded-[6px] flex items-center"
                style={{
                  ...hoverStyle,
                  opacity: hoveredIndex !== null ? 1 : 0,
                }}
              />
              <div
                className="absolute bottom-[-6px] h-[2px] bg-[#0e0f11] dark:bg-white transition-all duration-300 ease-out"
                style={activeStyle}
              />
              <div className="relative flex space-x-[6px] items-center">
                {tabs.map((tab, index) => (
                  <div
                    key={index}
                    ref={(el) => { tabRefs.current[index] = el }}
                    className={`px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px] ${
                      index === activeIndex ? "text-[#0e0e10] dark:text-white" : "text-[#0e0f1199] dark:text-[#ffffff99]"
                    }`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full">
                      {tab}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </header>
  )
}