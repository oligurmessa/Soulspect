import React, { useState, useRef, createContext, useContext, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BaseCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onItemChange?: (index: number) => void;
  onItemDelete?: (index: number) => void;
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  orientation?: "horizontal" | "vertical";
  opts?: any;
  plugins?: any[];
}

// ============================================================================
// CAROUSEL CONTEXT
// ============================================================================

interface CarouselContextType {
  api: any;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selectedIndex: number;
  scrollSnaps: number[];
}

const CarouselContext = createContext<CarouselContextType | null>(null);

export const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a BaseCarousel component");
  }
  return context;
};

// ============================================================================
// BASE CAROUSEL COMPONENT
// ============================================================================

export function BaseCarousel<T>({
  items,
  renderItem,
  onItemChange,
  onItemDelete,
  className = "",
  showControls = true,
  autoPlay = false,
  orientation = "horizontal",
  opts,
  plugins
}: BaseCarouselProps<T>) {
  // Initialize Embla Carousel
  const [carouselRef, api] = useEmblaCarousel({
    ...opts,
    axis: orientation === "horizontal" ? "x" : "y",
  }, plugins);

  // State for navigation controls
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  // Navigation functions
  const scrollPrev = useCallback(() => {
    if (api) api.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    if (api) api.scrollNext();
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    if (api) api.scrollTo(index);
  }, [api]);

  // Update scroll state
  const onSelect = useCallback((api: any) => {
    if (!api) return;

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
    const newIndex = api.selectedScrollSnap();
    setSelectedIndex(newIndex);
    onItemChange?.(newIndex);
  }, [onItemChange]);

  // Handle API initialization and events
  useEffect(() => {
    if (!api) return;

    setScrollSnaps(api.scrollSnapList());
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || !api) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0); // Loop back to start
      }
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [api, autoPlay]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!api) return;

      if (orientation === "horizontal") {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      } else {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          scrollNext();
        }
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onItemDelete?.(selectedIndex);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [api, orientation, scrollPrev, scrollNext, selectedIndex, onItemDelete]);

  // Context value
  const contextValue: CarouselContextType = {
    api,
    scrollPrev,
    scrollNext,
    canScrollPrev,
    canScrollNext,
    selectedIndex,
    scrollSnaps
  };

  if (!items || items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8 text-muted-foreground", className)}>
        No items to display
      </div>
    );
  }

  return (
    <CarouselContext.Provider value={contextValue}>
      <div className={cn("relative", className)}>
        {/* Main Carousel Container */}
        <div className="overflow-hidden" ref={carouselRef}>
          <div 
            className={cn(
              "flex",
              orientation === "vertical" ? "flex-col" : "flex-row"
            )}
          >
            {items.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex-[0_0_100%]",
                  orientation === "vertical" ? "min-h-0" : "min-w-0"
                )}
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        {showControls && items.length > 1 && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}

        {/* Indicators */}
        {items.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === selectedIndex
                    ? "bg-zinc-900 dark:bg-zinc-100"
                    : "bg-zinc-300 dark:bg-zinc-600"
                )}
                onClick={() => scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </CarouselContext.Provider>
  );
}

// ============================================================================
// NAVIGATION COMPONENTS
// ============================================================================

export const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    size?: "default" | "sm" | "lg";
  }
>(({ className, size = "default", ...props }, ref) => {
  const { scrollPrev, canScrollPrev, api } = useCarousel();

  return (
    <button
      ref={ref}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 left-2 z-10",
        "flex h-8 w-8 items-center justify-center rounded-full",
        "bg-white/80 text-zinc-900 shadow-md hover:bg-white",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-200",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

export const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    size?: "default" | "sm" | "lg";
  }
>(({ className, size = "default", ...props }, ref) => {
  const { scrollNext, canScrollNext, api } = useCarousel();

  return (
    <button
      ref={ref}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 right-2 z-10",
        "flex h-8 w-8 items-center justify-center rounded-full",
        "bg-white/80 text-zinc-900 shadow-md hover:bg-white",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-200",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </button>
  );
});
CarouselNext.displayName = "CarouselNext";

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("overflow-hidden", className)}
      {...props}
    />
  );
});
CarouselContent.displayName = "CarouselContent";

export const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

export default BaseCarousel;