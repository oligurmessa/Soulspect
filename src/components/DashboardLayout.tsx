// src/components/DashboardLayout.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-[#F2F0EF] overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/15 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main Content */}
      <motion.main
        className="transition-all duration-200 ease-in-out min-h-screen"
        style={{
          marginLeft: sidebarCollapsed ? 80 : 280,
        }}
        initial={false}
        animate={{
          marginLeft: sidebarCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <div className="relative z-10 p-6 min-h-screen">
          {children}
        </div>
      </motion.main>
    </div>
  );
};