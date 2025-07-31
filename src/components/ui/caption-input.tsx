"use client";
 
import * as React from "react";
import { cn } from "@/lib/utils";
import { Captions, X } from "lucide-react";
 
interface CaptionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
    onSave?: (value: string) => void;
}
 
const CaptionInput = React.forwardRef<HTMLInputElement, CaptionInputProps>(
    ({ 
        className, 
        onClear, 
        onSave,
        ...props 
    }, ref) => {
        const [hasValue, setHasValue] = React.useState(false);
        const [isFocused, setIsFocused] = React.useState(false);
        const [value, setValue] = React.useState(props.value || "");
 
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setValue(newValue);
            setHasValue(newValue !== "");
            props.onChange?.(e);
        };
 
        const handleClear = () => {
            setValue("");
            setHasValue(false);
            if (onClear) {
                onClear();
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && onSave) {
                onSave(value as string);
                e.currentTarget.blur();
            }
            if (e.key === 'Escape') {
                e.currentTarget.blur();
            }
        };

        const handleBlur = () => {
            setIsFocused(false);
            if (onSave) {
                onSave(value as string);
            }
        };
 
        return (
            <div className="relative w-full">
                <div className="relative">
                    <Captions className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                        "text-zinc-500 transition-colors duration-200",
                        isFocused && "text-zinc-900 dark:text-zinc-100"
                    )} />
                    
                    <input
                        ref={ref}
                        {...props}
                        value={value}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            // Base styles
                            "w-full h-10",
                            "bg-zinc-50 dark:bg-zinc-800",
                            "border border-zinc-200 dark:border-zinc-700",
                            "text-sm text-zinc-900 dark:text-zinc-100",
                            "rounded-sm",

                            // Padding
                            "pl-10",
                            hasValue ? "pr-12" : "pr-4",
                            
                            // Placeholder
                            "placeholder:text-zinc-500",
                            
                            // Focus and hover
                            "focus:outline-none",
                            "hover:border-zinc-300 dark:hover:border-zinc-600",
                            
                            // Transitions
                            "transition-all duration-200",
                            
                            className
                        )}
                    />
 
                    {hasValue && (
                        <button
                            onClick={handleClear}
                            className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2",
                                "p-1 rounded-full",
                                "text-zinc-500",
                                "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                "transition-colors"
                            )}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        );
    }
);
 
CaptionInput.displayName = "CaptionInput";
 
export { CaptionInput };