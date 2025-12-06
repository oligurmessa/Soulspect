import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ fullScreen, className }: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn("h-8 w-8 animate-spin text-neutral-400", className)}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      {spinner}
    </div>
  );
}