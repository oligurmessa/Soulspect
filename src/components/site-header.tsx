"use client";

import { usePathname } from "next/navigation";
import { UserProfile } from "@/components/user-profile";
import { SidebarTrigger } from "@/components/ui/sidebar";

const formatTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Dashboard";
  const lastSegment = pathname.split("/").pop() || "";
  const title = lastSegment.replace(/-/g, " ");
  return title.replace(/\b\w/g, (char) => char.toUpperCase());
};

// No more props are needed here.
export function SiteHeader() {
  const pathname = usePathname();
  const pageTitle = formatTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>

      <div className="ml-auto">
        <UserProfile />
      </div>
    </header>
  );
}