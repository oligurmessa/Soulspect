"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, Command } from "lucide-react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    shortcut?: string;
}

/**
 * SearchInput component with Cmd+K / Ctrl+K shortcut to focus.
 */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, shortcut = "⌘K", ...props }, ref) => {
        const inputRef = React.useRef<HTMLInputElement>(null);

        React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

        React.useEffect(() => {
            const handler = (e: KeyboardEvent) => {
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                    e.preventDefault();
                    inputRef.current?.focus();
                }
            };
            window.addEventListener("keydown", handler);
            return () => window.removeEventListener("keydown", handler);
        }, []);

        return (
            <div className="relative group">
                <div
                    className={cn(
                        "relative",
                        "bg-zinc-100 dark:bg-zinc-800",
                        "border border-zinc-200 dark:border-transparent",
                        "rounded-xl",
                        "transition-colors",
                        "duration-200",
                        "hover:border-zinc-300 dark:hover:border-zinc-700",
                        className
                    )}
                >
                    <div className="relative flex items-center">
                        <div
                            className={cn(
                                "absolute left-0 inset-y-0 w-11",
                                "flex items-center justify-center",
                                "border-r border-zinc-200 dark:border-zinc-700"
                            )}
                        >
                            <Search className="w-4 h-4 text-zinc-500" />
                        </div>

                        <input
                            ref={inputRef}
                            {...props}
                            className={cn(
                                "w-full h-11",
                                "pl-14 pr-16",
                                "bg-transparent",
                                "text-sm text-zinc-900 dark:text-zinc-100",
                                "placeholder:text-zinc-500",
                                "focus:outline-none"
                            )}
                        />

                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <kbd
                                className={cn(
                                    "hidden sm:inline-flex h-5 px-1.5 gap-0.5",
                                    "items-center text-[10px] font-medium",
                                    "bg-zinc-200 dark:bg-zinc-700",
                                    "text-zinc-500 dark:text-zinc-400",
                                    "rounded-sm border border-zinc-300 dark:border-zinc-600"
                                )}
                            >
                                <Command className="w-2.5 h-2.5" />
                                <span>K</span>
                            </kbd>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };