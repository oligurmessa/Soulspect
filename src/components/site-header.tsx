"use client";

import { usePathname } from "next/navigation";
import { UserProfile } from "@/components/user-profile";
import { SidebarTrigger } from "@/components/ui/sidebar";
import MobileNavDropdown from "@/components/MobileNavDropdown";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChatHistory } from "@/components/ChatHistory";

const formatTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.includes("/journal")) return "Journal";
  if (pathname.includes("/moments")) return "Moments";
  const lastSegment = pathname.split("/").pop() || "";
  const title = lastSegment.replace(/-/g, " ");
  return title.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getPageKey = (pathname: string): string => {
  if (pathname === "/dashboard") return "home";
  if (pathname.includes("/log")) return "log";
  if (pathname.includes("/journal")) return "journal";
  if (pathname.includes("/moments")) return "moments";
  if (pathname.includes("/analytics")) return "analytics";
  if (pathname.includes("/soulspace")) return "soulspace";
  return "home";
};

export function SiteHeader() {
  const pathname = usePathname();
  const pageTitle = formatTitle(pathname);
  const currentPage = getPageKey(pathname);
  const isJournalPage = pathname.includes("/journal");
  const isLogPage = pathname.includes("/log");
  const isSoulspacePage = pathname.includes("/soulspace");
  const isMomentsPage = pathname.includes("/moments");

  // Journal page state - always declare hooks at the top level
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Hide header completely on log page
  // Also hide on Moments page if it has its own header (based on dashboard/moments/page.tsx having one)
  // But user asked to make other pages "similar to moments", so maybe we SHOULD show this header and remove the one in page?
  // For now, let's style THIS header to match.
  if (isLogPage) {
    return null;
  }

  // Mock tags - in real app this would come from the journal page
  const allTags = ['Work', 'Family', 'Travel', 'Health'];

  return (
    <header className={cn(
      "sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 transition-colors duration-200",
      // Unified Header Style: Matches Moments/Log aesthetic
      "bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700"
    )}>
      <div className="flex items-center gap-4">
        {/* Mobile Navigation Dropdown - replaces page title on mobile */}
        <div className="lg:hidden">
          <MobileNavDropdown currentPage={currentPage} />
        </div>

        {/* Desktop Page Title - hidden on mobile */}
        <h1 className="hidden lg:block text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Journal Search and Filter */}
      {isJournalPage && (
        <div className="flex items-center gap-3 flex-1 justify-end max-w-4xl">
          {/* Search Input */}
          <div className="w-full max-w-xl">
            <SearchInput
              placeholder="Search moments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Button & Dropdown */}
          <div className="relative">
            <Button
              variant={activeFilter ? "default" : "ghost"}
              className="gap-2"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{activeFilter || "Filter"}</span>
              {activeFilter && (
                <X
                  className="h-3 w-3 ml-1 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFilter(null);
                  }}
                />
              )}
            </Button>

            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-20">
                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/50 mb-1">
                    Filter by Tag
                  </div>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors",
                        activeFilter === tag &&
                        "text-blue-600 dark:text-blue-400 font-medium"
                      )}
                      onClick={() => {
                        setActiveFilter(tag);
                        setIsFilterOpen(false);
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                  {allTags.length === 0 && (
                    <div className="px-3 py-2 text-sm text-zinc-400 italic">
                      No tags found
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {isSoulspacePage && <ChatHistory />}
        <UserProfile />
      </div>
    </header>
  );
}