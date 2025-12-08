"use client";

import * as React from "react";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileNavDropdown from "@/components/MobileNavDropdown";
import { Button } from "@/components/ui/button";

interface JournalHeaderProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    activeFilter: string | null;
    onFilterChange: (filter: string | null) => void;
    totalEntries: number;
}

const FILTERS = [
    { id: 'journal', label: 'Journal' },
    { id: 'emotion', label: 'Emotions' },
    { id: 'voice', label: 'Voice' },
    { id: 'video', label: 'Video' },
    { id: 'chat', label: 'AI Chat' },
];

export function JournalHeader({
    searchQuery,
    onSearchChange,
    activeFilter,
    onFilterChange,
    totalEntries
}: JournalHeaderProps) {

    const [isSearchFocused, setIsSearchFocused] = React.useState(false);

    return (
        <div className="sticky top-0 z-30 bg-zinc-50/95 dark:bg-[#191919]/95 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">

                {/* Row 1: Mobile Top Bar (Nav + Title + Count) */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="lg:hidden">
                            <MobileNavDropdown currentPage="moments" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                            Moments
                        </h1>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {totalEntries}
                        </span>
                    </div>
                </div>

                {/* Row 2: Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    <div className={cn(
                        "relative flex-1 transition-all duration-200",
                        isSearchFocused ? "ring-2 ring-blue-500/20" : ""
                    )}>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search memories..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            className="block w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-2.5 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <div className="p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                    <X className="h-3 w-3 text-zinc-500" />
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Mobile: Horizontal Filter Scroll */}
                    {/* Desktop: Inline Filters? Actually, keeping a similar UI for simplicity/consistency is fine, 
              but maybe show all on desktop. */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mask-linear-fade">
                        <Button
                            variant={activeFilter === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFilterChange(null)}
                            className={cn(
                                "rounded-full h-8 px-4 text-xs font-medium whitespace-nowrap shrink-0",
                                activeFilter === null
                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800"
                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                            )}
                        >
                            All
                        </Button>
                        {FILTERS.map(filter => (
                            <Button
                                key={filter.id}
                                variant={activeFilter === filter.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => onFilterChange(activeFilter === filter.id ? null : filter.id)}
                                className={cn(
                                    "rounded-full h-8 px-4 text-xs font-medium whitespace-nowrap shrink-0",
                                    activeFilter === filter.id
                                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800"
                                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                                )}
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
