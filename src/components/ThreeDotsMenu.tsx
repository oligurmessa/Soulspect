"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThreeDotsMenuProps {
  className?: string;
  onMenuItemClick?: (action: string) => void;
}

export default function ThreeDotsMenu({ className, onMenuItemClick }: ThreeDotsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "export", label: "Export Entry" },
    { id: "bookmark", label: "Bookmark Entry" },
    { id: "delete", label: "Delete Entry", danger: true },
  ];

  const handleItemClick = (action: string) => {
    onMenuItemClick?.(action);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        className={cn(
          "flex items-center justify-center",
          "h-10 w-10 rounded-lg",
          "bg-background border border-border",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted transition-colors",
          "shadow-sm",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <MoreHorizontal className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              className="absolute top-full right-0 mt-2 w-48 z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="bg-background border border-border rounded-lg shadow-lg py-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm",
                      "hover:bg-muted transition-colors",
                      "flex items-center justify-start",
                      item.danger 
                        ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" 
                        : "text-foreground"
                    )}
                    onClick={() => handleItemClick(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}