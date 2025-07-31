"use client";
 
import { cn } from "@/lib/utils";
import { AudioLines } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
 
interface AudioConfirmationBannerProps {
    message?: string;
    className?: string;
    onAccept?: () => void;
    onReject?: () => void;
}
 
function BannerContent({
    message,
    onAccept,
    onReject,
}: AudioConfirmationBannerProps) {
    return (
        <div className="relative flex flex-col gap-4 ">
            <div className="flex items-start gap-3">
                <AudioLines className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-foreground text-sm">
                    {message ||
                        "You already have 2 audio recordings. Adding a new one will replace the oldest recording. Do you want to continue?"}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onReject}
                    className="px-3 py-1.5 
                             border border-border
                             hover:bg-accent hover:text-accent-foreground
                             rounded-md text-sm font-medium
                             transition-all duration-200
                             text-muted-foreground
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Cancel audio recording"
                >
                    Cancel
                </button>
                <button
                    onClick={onAccept}
                    className="px-3 py-1.5 
                             bg-background hover:bg-accent
                             border border-border
                             text-foreground hover:text-accent-foreground
                             rounded-md text-sm font-medium
                             transition-all duration-200 shadow-sm 
                             hover:shadow-md focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-ring
                             focus-visible:ring-offset-2"
                    aria-label="Continue with audio recording"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
 
export default function AudioConfirmationBanner({
    message,
    className,
    onAccept = () => {},
    onReject = () => {},
}: AudioConfirmationBannerProps) {
    const [isVisible, setIsVisible] = useState(true);
 
    const handleAccept = () => {
        setIsVisible(false);
        onAccept();
    };
 
    const handleReject = () => {
        setIsVisible(false);
        onReject();
    };
 
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                        "fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md bg-background/95 ring-1 ring-border backdrop-blur-sm rounded-xl p-1 shadow-lg",
                        className
                    )}
                >
                    <div className="p-4">
                        <BannerContent
                            message={message}
                            onAccept={handleAccept}
                            onReject={handleReject}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}