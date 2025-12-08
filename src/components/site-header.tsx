"use client";

import { usePathname } from "next/navigation";
import { UserProfile } from "@/components/user-profile";
import { SidebarTrigger } from "@/components/ui/sidebar";
import MobileNavDropdown from "@/components/MobileNavDropdown";
import { cn } from "@/lib/utils";
import { ChatHistory } from "@/components/ChatHistory";

const formatTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.includes("/journal")) return "Journal";
  if (pathname.includes("/moments")) return "Moments";
  const lastSegment = pathname.split("/").pop() || "";
  const title = lastSegment.replace(/-/g, " ");
  return title.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getPageKey = (pathname: string): string => {
  if (pathname === "/dashboard") return "home";
  if (pathname.includes("/log")) return "log";
  if (pathname.includes("/journal")) return "journal";
  if (pathname.includes("/moments")) return "moments";
  if (pathname.includes("/analytics")) return "analytics";
  if (pathname.includes("/soulspace")) return "soulspace";
  return "home";
};

export function SiteHeader() {
  const pathname = usePathname();
  const pageTitle = formatTitle(pathname);
  const currentPage = getPageKey(pathname);

  const isLogPage = pathname.includes("/log");
  const isSoulspacePage = pathname.includes("/soulspace");
  const isMomentsPage = pathname.includes("/moments");

  // Journal page state - always declare hooks at the top level


  // Hide header completely on log page
  // Also hide on Moments page if it has its own header (based on dashboard/moments/page.tsx having one)
  // But user asked to make other pages "similar to moments", so maybe we SHOULD show this header and remove the one in page?
  // For now, let's style THIS header to match.
  if (isLogPage) {
    return null;
  }

  // Mock tags - in real app this would come from the journal page


  return (
    <header className={cn(
      "sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 transition-colors duration-200",
      // Unified Header Style: Matches Moments/Log aesthetic
      "bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700"
    )}>
      <div className="flex items-center gap-4">
        {/* Mobile Navigation Dropdown - replaces page title on mobile */}
        <div className="lg:hidden">
          <MobileNavDropdown currentPage={currentPage} />
        </div>

        {/* Desktop Page Title - hidden on mobile */}
        <h1 className="hidden lg:block text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Journal Search and Filter */}


      <div className="ml-auto flex items-center gap-2">
        {isSoulspacePage && <ChatHistory />}
        <UserProfile />
      </div>
    </header>
  );
}