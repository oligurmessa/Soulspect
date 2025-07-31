"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Fingerprint, Scan, ShieldCheck, Loader2 } from "lucide-react";

interface Input08Props extends React.InputHTMLAttributes<HTMLInputElement> {
    onBiometricAuth?: () => Promise<void>;
    showBiometricButton?: boolean;
    isAuthenticating?: boolean;
    isAuthenticated?: boolean;
}

const Input08 = React.forwardRef<HTMLInputElement, Input08Props>(
    ({ 
        className, 
        onBiometricAuth, 
        showBiometricButton = true, 
        isAuthenticating = false, 
        isAuthenticated = false, 
        ...props 
    }, ref) => {
        const [scanAnimation, setScanAnimation] = React.useState(false);
        const [authenticated, setAuthenticated] = React.useState(isAuthenticated);

        const handleBiometricAuth = async () => {
            if (onBiometricAuth) {
                setScanAnimation(true);
                await onBiometricAuth();
                setTimeout(() => setScanAnimation(false), 1000);
                setAuthenticated(true);
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                setAuthenticated(true);
            }
        };

        return (
            <div className="relative">
                <div className={cn(
                    "relative overflow-hidden",
                    "bg-zinc-100 dark:bg-zinc-800",
                    "border border-zinc-200 dark:border-transparent",
                    "rounded-xl",
                    "transition-colors",
                    "duration-200",
                    "hover:border-zinc-300 dark:hover:border-zinc-700",
                    className
                )}>
                    {/* Scan line animation */}
                    {scanAnimation && (
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-linear-to-b from-blue-500 to-transparent animate-scan" />
                        </div>
                    )}

                    <div className="relative flex items-center">
                        <div className={cn(
                            "absolute left-0 inset-y-0 w-11",
                            "flex items-center justify-center",
                            "border-r border-zinc-200 dark:border-zinc-700"
                        )}>
                            <Scan className={cn(
                                "w-4 h-4 transition-colors duration-300",
                                authenticated 
                                    ? "text-green-500" 
                                    : "text-zinc-500 dark:text-zinc-400"
                            )} />
                        </div>

                        <input
                            ref={ref}
                            {...props}
                            onKeyDown={handleKeyDown}
                            className={cn(
                                "w-full h-11",
                                "pl-14 pr-16",
                                "bg-transparent",
                                "text-sm text-zinc-900 dark:text-zinc-100",
                                "placeholder:text-zinc-500",
                                "focus:outline-hidden",
                            )}
                        />

                        {showBiometricButton && (
                            <button
                                onClick={handleBiometricAuth}
                                disabled={isAuthenticating}
                                className={cn(
                                    "absolute right-3",
                                    "p-1.5 rounded-full",
                                    "transition-colors",
                                    authenticated 
                                        ? "bg-green-100 dark:bg-green-900/30" 
                                        : "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                    "disabled:opacity-50"
                                )}
                            >
                                {isAuthenticating ? (
                                    <Loader2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 animate-spin" />
                                ) : authenticated ? (
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Fingerprint className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Status indicator */}
                <div className={cn(
                    "absolute -bottom-6 left-0 right-0",
                    "flex items-center justify-center",
                    "text-xs font-medium",
                    "transition-opacity duration-300",
                    authenticated ? "opacity-100" : "opacity-0"
                )}>
                    <span className="text-green-600 dark:text-green-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Identity
                    </span>
                </div>
            </div>
        );
    }
);

Input08.displayName = "Input08";

export default Input08;