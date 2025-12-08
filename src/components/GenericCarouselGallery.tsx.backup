"use client";

import React, { useState, useRef, createContext, useContext, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

// --- Carousel Component Implementation (based on shadcn/ui and embla-carousel) ---

// Context to share the carousel API between parent and child components
const CarouselContext = createContext<any>(null);

// Custom hook to access the carousel context
const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel /> component");
  }
  return context;
};

// Main Carousel container component
const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
    opts?: any;
    setApi?: (api: any) => void;
    plugins?: any[];
  }
>(({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}, ref) => {
  // Initialize Embla Carousel
  const [carouselRef, api] = useEmblaCarousel({
    ...opts,
    axis: orientation === "horizontal" ? "x" : "y",
  }, plugins);

  // State to track if scrolling is possible in either direction
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Callback to update scroll capabilities based on current carousel state
  const onSelect = useCallback((api: any) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  // Effect to attach and detach event listeners for carousel API
  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    if (setApi) {
      setApi(api);
    }
    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect, setApi]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation,
        scrollPrev: useCallback(() => api?.scrollPrev(), [api]),
        scrollNext: useCallback(() => api?.scrollNext(), [api]),
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        ref={ref}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
});
Carousel.displayName = "Carousel";

// Carousel content area, which wraps the individual items
const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();
  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === 'horizontal' ? '' : 'flex-col',
          className
        )}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

// Individual Carousel item
const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

// Previous button for carousel navigation
const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return (
    <button
      ref={ref}
      className={cn(
        "absolute h-8 w-8 rounded-full flex items-center justify-center bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      {...props}
    >
      <ChevronLeft className="h-4 w-4 text-gray-700" />
      <span className="sr-only">Previous slide</span>
    </button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

// Next button for carousel navigation
const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();
  return (
    <button
      ref={ref}
      className={cn(
        "absolute h-8 w-8 rounded-full flex items-center justify-center bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      onClick={scrollNext}
      disabled={!canScrollNext}
      {...props}
    >
      <ChevronRight className="h-4 w-4 text-gray-700" />
      <span className="sr-only">Next slide</span>
    </button>
  );
});
CarouselNext.displayName = "CarouselNext";

// --- Reusable GenericCarouselGallery Component ---

// Define a generic Item interface to allow various data types
export interface Item {
  id: string | number;
  [key: string]: any;
}

// Props interface for GenericCarouselGallery
interface GenericCarouselGalleryProps<T extends Item> {
  items: T[];
  onRemoveItem: (id: string | number, event?: React.MouseEvent) => void;
  renderItemContent: (item: T) => React.ReactNode;
  renderDialogContent: (item: T, onRemove: (id: string | number) => void) => React.ReactNode;
  title: string;
  className?: string;
}

const GenericCarouselGallery = <T extends Item>({
  items = [],
  onRemoveItem,
  renderItemContent,
  renderDialogContent,
  title,
  className
}: GenericCarouselGalleryProps<T>) => {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = (item: T) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  // If there are no items, render nothing for this carousel instance
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Main container for displaying the carousel and its header */}
      <div className={cn("relative w-full", className)}>

        <Carousel
          opts={{ align: "start", loop: items.length > 3 }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {items.map((item) => (
              <CarouselItem
                key={item.id}
                className="pl-2 md:basis-1/2 lg:basis-1/3"
              >
                <div className="cursor-pointer group p-0 m-0">
                  <div
                    className="relative w-full aspect-square overflow-hidden bg-gray-100 rounded-md shadow-sm border border-gray-200"
                    onClick={() => openDialog(item)}
                  >
                    {renderItemContent(item)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id, e);
                      }}
                      className="absolute top-0.5 right-0.5 bg-red-500/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X size={10} strokeWidth={3}/>
                    </button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* Show navigation buttons only if there are more than 3 items */}
          {items.length > 3 && (
            <>
              <CarouselPrevious className="left-0 h-6 w-6 -translate-x-3 top-1/2 -translate-y-1/2" />
              <CarouselNext className="right-0 h-6 w-6 translate-x-3 top-1/2 -translate-y-1/2" />
            </>
          )}
        </Carousel>
      </div>

      {/* Item dialog for viewing selected item */}
      {isDialogOpen && selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={closeDialog}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden relative shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDialog}
              className="absolute top-3 right-3 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col">
              {renderDialogContent(selectedItem, onRemoveItem)}
            </div>
          </div>
        </div>
      )}

      {/* Adding keyframe animations for dialog */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </>
  );
};

export default GenericCarouselGallery;