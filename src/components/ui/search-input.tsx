"use client";
 
import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X, Loader2 } from "lucide-react";
 
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
    showSearchIcon?: boolean;
    isLoading?: boolean;
    suggestions?: string[];
    onSuggestionClick?: (suggestion: string) => void;
}
 
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ 
        className, 
        onClear, 
        showSearchIcon = true, 
        isLoading = false,
        suggestions = [],
        onSuggestionClick,
        ...props 
    }, ref) => {
        const [hasValue, setHasValue] = React.useState(false);
        const [isFocused, setIsFocused] = React.useState(false);
 
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setHasValue(e.target.value !== "");
            props.onChange?.(e);
        };
 
        const handleClear = () => {
            if (onClear) {
                onClear();
            }
            setHasValue(false);
        };
 
        return (
            <div className="relative w-full">
                <div className="relative">
                    {showSearchIcon && (
                        <Search className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                            "text-zinc-500 transition-colors duration-200",
                            isFocused && "text-zinc-900 dark:text-zinc-100"
                        )} />
                    )}
                    
                    <input
                        ref={ref}
                        {...props}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={cn(
                            // Base styles
                            "w-full h-11",
                            "bg-zinc-100 dark:bg-zinc-800",
                            "border border-zinc-200 dark:border-transparent",
                            "text-sm text-zinc-900 dark:text-zinc-100",
                            "rounded-xl",
                            
                            // Padding
                            showSearchIcon ? "pl-10" : "pl-4",
                            hasValue ? "pr-16" : "pr-4",
                            
                            // Placeholder
                            "placeholder:text-zinc-500",
                            
                            // Focus and hover
                            "focus:outline-hidden",
                            "hover:border-zinc-300 dark:hover:border-zinc-700",
                            
                            // Transitions
                            "transition-colors",
                            "duration-200",
                            
                            className
                        )}
                    />
 
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {isLoading && (
                            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                        )}
                        
                        {hasValue && (
                            <button
                                onClick={handleClear}
                                className={cn(
                                    "p-1.5 rounded-full",
                                    "text-zinc-500",
                                    "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                    "transition-colors"
                                )}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
 
                {/* Suggestions dropdown */}
                {isFocused && suggestions.length > 0 && (
                    <div className={cn(
                        "absolute w-full mt-2",
                        "bg-zinc-100 dark:bg-zinc-800",
                        "border border-zinc-200 dark:border-zinc-700",
                        "rounded-xl",
                        "divide-y divide-zinc-200 dark:divide-zinc-700",
                        "overflow-hidden"
                    )}>
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSuggestionClick?.(suggestion)}
                                className={cn(
                                    "w-full px-4 py-2.5 text-left",
                                    "text-sm text-zinc-900 dark:text-zinc-100",
                                    "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                    "transition-colors"
                                )}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }
);
 
SearchInput.displayName = "SearchInput";
 
export { SearchInput };