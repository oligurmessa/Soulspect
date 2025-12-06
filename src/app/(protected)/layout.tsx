"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Geist, Geist_Mono } from "next/font/google"
import { cn } from "@/lib/utils"
import { NuqsAdapter } from "nuqs/adapters/next/app";




const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (!loading && user && !user.emailVerified) {
      router.push("/verify-email")
    }
  }, [user, loading, router])

  if (loading || !user || !user.emailVerified) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div
      className={cn(
        "h-screen w-screen overflow-hidden flex flex-col bg-zinc-50 dark:bg-[#191919]",
        geistSans.variable,
        geistMono.variable,
        "antialiased"
      )}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <NuqsAdapter>
            {/* Main needs to be flex container to handle children growth properly */}
            <main className="flex-1 h-full overflow-hidden">{children}</main>
          </NuqsAdapter>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
