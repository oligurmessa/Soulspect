"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileNavDropdown from "@/components/MobileNavDropdown";
import { Button } from "@/components/ui/button";

interface MomentsHeaderProps {
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

export function MomentsHeader({
    searchQuery,
    onSearchChange,
    activeFilter,
    onFilterChange,
    totalEntries
}: MomentsHeaderProps) {

    const [isSearchFocused, setIsSearchFocused] = React.useState(false);

    return (
        <div className="sticky top-0 z-30 bg-zinc-50/80 dark:bg-[#191919]/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-300">
            <div className="px-4 py-3 md:px-6 md:py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 md:justify-between">

                    {/* Row 1: Mobile Top Bar (Nav + Search) // Left Section (Desktop: Title + Count) */}
                    <div className="flex items-center gap-3 w-full md:w-auto">

                        {/* Mobile Nav */}
                        <div className="lg:hidden shrink-0">
                            <MobileNavDropdown currentPage="moments" />
                        </div>

                        {/* Desktop Title & Count (Hidden on Mobile) */}
                        <div className="hidden md:flex items-baseline gap-3">
                            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                                Moments
                            </h1>
                            <span className="text-xs font-medium text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-200/50 dark:border-zinc-700/50">
                                {totalEntries}
                            </span>
                        </div>

                        {/* Mobile Search (Moves here on mobile, hidden on desktop if we want strict separation, but simpler to adapt the same input) */}
                        {/* Actually, user wants search "right next to nav". Let's put the search *here* on mobile. */}
                        <div className={cn(
                            "relative group flex-1 md:hidden transition-all duration-300 ease-out",
                            isSearchFocused ? "ring-2 ring-primary/20 rounded-xl" : ""
                        )}>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className={cn(
                                    "h-4 w-4 transition-colors duration-200",
                                    isSearchFocused ? "text-primary" : "text-zinc-400"
                                )} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                className="block w-full rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 py-2 pl-10 pr-8 text-sm placeholder:text-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange("")}
                                    className="absolute inset-y-0 right-0 pr-2 flex items-center"
                                >
                                    <div className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                                        <X className="h-3 w-3 text-zinc-500" />
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Row 2 (Mobile) / Right Section (Desktop) */}
                    <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:justify-end">

                        {/* Desktop Search (Hidden on mobile) */}
                        <div className={cn(
                            "relative group hidden md:block w-full max-w-[240px] transition-all duration-300 ease-out",
                            isSearchFocused ? "max-w-[320px] ring-2 ring-primary/20 rounded-xl" : ""
                        )}>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className={cn(
                                    "h-4 w-4 transition-colors duration-200",
                                    isSearchFocused ? "text-primary" : "text-zinc-400 group-hover:text-zinc-500"
                                )} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                className="block w-full rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 py-2 pl-10 pr-8 text-sm placeholder:text-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange("")}
                                    className="absolute inset-y-0 right-0 pr-2 flex items-center"
                                >
                                    <div className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                                        <X className="h-3 w-3 text-zinc-500" />
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Filters (Always visible, scrollable on mobile) */}
                        <div className="flex-1 md:flex-none flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mask-linear-fade">
                            <Button
                                variant={activeFilter === null ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => onFilterChange(null)}
                                className={cn(
                                    "rounded-full h-8 px-4 text-xs font-medium transition-all duration-200 shrink-0",
                                    activeFilter === null
                                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                )}
                            >
                                All
                            </Button>
                            {FILTERS.map(filter => (
                                <Button
                                    key={filter.id}
                                    variant={activeFilter === filter.id ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => onFilterChange(activeFilter === filter.id ? null : filter.id)}
                                    className={cn(
                                        "rounded-full h-8 px-4 text-xs font-medium transition-all duration-200 border border-transparent shrink-0",
                                        activeFilter === filter.id
                                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
