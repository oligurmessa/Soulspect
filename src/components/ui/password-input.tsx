"use client";
 
import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, EyeOff, Key, RefreshCw } from "lucide-react";
 
interface Input07Props extends React.InputHTMLAttributes<HTMLInputElement> {
    showGenerateButton?: boolean;
    onGenerate?: () => void;
}
 
const Input07 = React.forwardRef<HTMLInputElement, Input07Props>(
    ({ className, showGenerateButton, onGenerate, ...props }, ref) => {
        const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
        const [isCopied, setIsCopied] = React.useState(false);
 
        const copyToClipboard = async () => {
            if (props.value) {
                await navigator.clipboard.writeText(props.value.toString());
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }
        };
 
        return (
            <div className="relative">
                <div className={cn(
                    "relative",
                    "bg-zinc-100 dark:bg-zinc-800",
                    "border border-zinc-200 dark:border-transparent",
                    "rounded-xl",
                    "transition-colors",
                    "duration-200",
                    "hover:border-zinc-300 dark:hover:border-zinc-700",
                    className
                )}>
                    <div className={cn(
                        "absolute left-0 inset-y-0 w-11",
                        "flex items-center justify-center",
                        "border-r border-zinc-200 dark:border-zinc-700"
                    )}>
                        <Key className="w-4 h-4 text-zinc-500" />
                    </div>
 
                    <input
                        ref={ref}
                        type={isPasswordVisible ? "text" : "password"}
                        className={cn(
                            "w-full h-11",
                            "pl-14 pr-24",
                            "bg-transparent",
                            "text-sm text-zinc-900 dark:text-zinc-100",
                            "placeholder:text-zinc-500",
                            "focus:outline-hidden",
                        )}
                        {...props}
                    />
 
                    <div className="absolute right-2 inset-y-0 flex items-center gap-1">
                        {showGenerateButton && (
                            <button
                                type="button"
                                onClick={onGenerate}
                                className={cn(
                                    "p-1.5 rounded-full",
                                    "text-zinc-500",
                                    "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                    "transition-colors"
                                )}
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        )}
 
                        <button
                            type="button"
                            onClick={copyToClipboard}
                            className={cn(
                                "p-1.5 rounded-full",
                                "text-zinc-500",
                                "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                "transition-colors"
                            )}
                        >
                            {isCopied ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
 
                        <button
                            type="button"
                            onClick={() => setIsPasswordVisible((prev) => !prev)}
                            className={cn(
                                "p-1.5 rounded-full",
                                "text-zinc-500",
                                "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                "transition-colors"
                            )}
                        >
                            <EyeOff className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);
 
Input07.displayName = "Input07";
 
export default Input07;