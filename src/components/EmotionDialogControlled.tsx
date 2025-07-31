"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { EmotionItem } from "./ItemCarousel";
import { useRouter } from "next/navigation";

interface EmotionDialogControlledProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    emotionItem?: EmotionItem;
    onDelete?: () => void;
}

export default function EmotionDialogControlled({ open, onOpenChange, emotionItem, onDelete }: EmotionDialogControlledProps) {
    // Debug: received emotion item data
    const router = useRouter();
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <DialogHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <DialogTitle className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                        <div className="w-8 h-8 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/20 flex items-center justify-center">
                            <Heart className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                        </div>
                        {emotionItem?.emotion || "Emotion"} moment
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-md text-zinc-500 dark:text-zinc-400">
                        Logged: {emotionItem?.createdAt.toLocaleString() || "Unknown time"}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-md font-medium text-zinc-900 dark:text-zinc-100">
                            feeling:
                        </h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {emotionItem?.emotions && Array.isArray(emotionItem.emotions) && emotionItem.emotions.length > 0 
                                ? emotionItem.emotions.join(', ')
                                : emotionItem?.emotion || "Unknown"
                            }
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-md font-medium text-zinc-900 dark:text-zinc-100">
                            triggers:
                        </h4>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
                            <p>
                                {emotionItem?.triggers && Array.isArray(emotionItem.triggers) && emotionItem.triggers.length > 0 
                                    ? emotionItem.triggers.join(', ')
                                    : "No triggers recorded"
                                }
                            </p>
                            {emotionItem?.note && (
                                <p>Note: {emotionItem.note}</p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            onDelete?.();
                            onOpenChange(false);
                        }}
                        className="w-full h-9 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800"
                    >
                        Delete
                    </Button>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            router.push('/dashboard/journal');
                        }}
                        className="w-full h-9 bg-black hover:bg-gray-900 text-white"
                    >
                        More Logs
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}