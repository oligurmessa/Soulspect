"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: "emotion-logging",
    label: "Emotion Logging",
    icon: "mood",
    href: "/dashboard/emotions",
  },
  {
    id: "smart-journal",
    label: "Smart Journal",
    icon: "auto_stories",
    href: "/dashboard/journal",
  },
  {
    id: "ai-insights",
    label: "AI Insights",
    icon: "psychology",
    href: "/dashboard/insights",
    badge: "AI",
  },
  {
    id: "growth-tracking",
    label: "Growth Tracking",
    icon: "trending_up",
    href: "/dashboard/growth",
  },
  {
    id: "soul-work",
    label: "Soul Work",
    icon: "self_improvement",
    href: "/dashboard/soul-work",
  },
  {
    id: "core-values",
    label: "Core Values",
    icon: "favorite",
    href: "/dashboard/values",
  },
];

export const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const [showUserPanel, setShowUserPanel] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 },
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 },
  };

  return (
    <>
      <motion.aside
        className="fixed left-0 top-0 z-40 h-screen glass border-r border-white/30 flex flex-col"
        variants={sidebarVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="logo"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">
                    psychology
                  </span>
                </div>
                <span className="text-xl font-bold text-gray-800">
                  soulspect
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={onToggle}
            className="glass-button p-2 hover:scale-105 transition-all duration-150"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-gray-800">
              {isCollapsed ? "menu_open" : "menu"}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 custom-scrollbar overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={`sidebar-item w-full ${isActive ? "active" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className={`sidebar-icon material-symbols-outlined ${isActive ? "text-gray-700" : "text-gray-600"}`}>
                    {item.icon}
                  </span>
                  
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.div
                        variants={contentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        transition={{ duration: 0.15 }}
                        className="flex items-center justify-between flex-1 min-w-0"
                      >
                        <span className={`sidebar-text ${isActive ? "text-gray-800" : "text-gray-700"}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium">
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-600 to-gray-800 rounded-r-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {/* User Account Section */}
        <div className="p-4 border-t border-white/20">
          <button
            onClick={() => setShowUserPanel(true)}
            className="sidebar-item w-full group"
            title={isCollapsed ? "Account" : undefined}
          >
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-white/30 group-hover:border-gray-400/50 transition-colors duration-150"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm">
                    person
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#F2F0EF]" />
            </div>
            
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="sidebar-text text-gray-800">Account</div>
                  <div className="text-xs text-gray-600 truncate">
                    {user?.email}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* User Panel Modal */}
      <AnimatePresence>
        {showUserPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              onClick={() => setShowUserPanel(false)}
            />
            
            {/* User Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.2 }}
              className="fixed left-4 bottom-20 z-50 w-80"
            >
              <div className="glass-card p-6 shadow-2xl animate-glow">
                <div className="flex items-center gap-4 mb-6">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-16 h-16 rounded-full border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-2xl">
                        person
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                      {user?.displayName || "Welcome"}
                    </h3>
                    <p className="text-gray-600 text-sm truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-gray-600 text-sm">Account Status</span>
                    <span className={`text-sm font-medium ${user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {user?.emailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-gray-600 text-sm">Member Since</span>
                    <span className="text-gray-800 text-sm">
                      {user?.metadata.creationTime 
                        ? new Date(user.metadata.creationTime).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUserPanel(false)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-700 hover:bg-red-500/30 transition-all duration-150 text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};