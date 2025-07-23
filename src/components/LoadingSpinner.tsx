import { cn } from "@/lib/utils"; // Assuming you use a cn utility for classnames

// Define the props for the component, including the optional 'fullScreen' prop
interface LoadingSpinnerProps {
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ fullScreen, className }: LoadingSpinnerProps) {
  // The spinner element itself
  const spinner = (
    <div
      className={cn(
        "h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary",
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  // If 'fullScreen' is true, wrap the spinner in a full-screen overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  // Otherwise, just return the spinner element
  return spinner;
}