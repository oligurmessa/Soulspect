"use client"

import { motion } from "framer-motion"
import React from "react"

interface BrandButtonProps {
  selected?: boolean
  onClick?: () => void
  label: string
}

export default function BrandButton({ selected = false, onClick, label }: BrandButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={false}
      animate={{
        backgroundColor: selected ? "#2a1711" : "rgba(39, 39, 42, 0.5)",
        scale: selected ? 1.02 : 1,
        opacity: 1,
      }}
      whileHover={{
        backgroundColor: selected ? "#2a1711" : "rgba(39, 39, 42, 0.8)",
        opacity: 1.05,
      }}
      whileTap={{
        backgroundColor: selected ? "#1f1209" : "rgba(13, 34, 23, 0.9)",
        scale: 0.97,
        opacity: 0.95,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.5,
        backgroundColor: { duration: 0.1 },
      }}
      className={`
        flex items-center gap-2 px-6 py-2 text-base font-medium
        rounded-2xl ring-1 ring-inset transition-colors duration-300
        ${selected
          ? "text-[#ff9066] ring-[hsla(0,0%,100%,0.12)]"
          : "text-zinc-400 ring-[hsla(0,0%,100%,0.06)]"}
      `}
      style={{
        textShadow: selected ? "0 0 8px rgba(255, 144, 102, 0.5)" : "none"
      }}
    >
      <span>{label}</span>
    </motion.button>
  )
}
