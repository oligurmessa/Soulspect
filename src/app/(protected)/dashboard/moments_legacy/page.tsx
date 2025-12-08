"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Moon, Sun, Menu, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MomentClient } from "@/lib/data/client/moments";
import { MomentsList } from "@/components/features/moments/MomentsList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { toast } from "sonner";

type FilterType = "all" | "journal" | "emotion" | "voice" | "photo" | "video";
type SortType = "newest" | "oldest" | "mood-high" | "mood-low";

export default function MomentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [moments, setMoments] = useState<any[]>([]);
  const [filteredMoments, setFilteredMoments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Load moments
  useEffect(() => {
    if (!user) return;
    
    const loadMoments = async () => {
      try {
        setIsLoading(true);
        
        // Sample data matching the demo
        const sampleMoments = [
          {
            id: "1",
            title: "First Day of School",
            content: "Emma was so excited to start kindergarten today. She wore her new backpack with pride and couldn't stop talking about making new friends.",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            type: "journal",
            mood: 5,
          },
          {
            id: "2", 
            title: "Learning to Ride a Bike",
            content: "After weeks of practice, Jake finally rode his bike without training wheels! His face lit up with the biggest smile when he realized he was doing it.",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            type: "journal",
            mood: 4,
          },
          {
            id: "3",
            title: "Bedtime Story Giggles",
            content: "Tonight's bedtime story had Lily in stitches. She kept asking me to read the funny parts over and over again. These moments are precious.",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            type: "journal",
            mood: 3,
          },
          {
            id: "4",
            title: "First Soccer Goal",
            content: "Marcus scored his first goal at soccer practice today! The coach and all the kids cheered. He's been practicing so hard and it finally paid off.",
            timestamp: new Date(Date.now() - 60 * 1000), // Just now
            type: "journal",
            mood: 5,
          },
          {
            id: "5",
            title: "Sharing with Siblings",
            content: "Witnessed the sweetest moment today - Sophie voluntarily shared her favorite toy with her little brother. Growing up so fast and kind.",
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            type: "journal",
            mood: 4,
          },
          {
            id: "6",
            title: "Art Project Masterpiece",
            content: "Noah brought home his art project from school - a colorful painting of our family. It's now proudly displayed on the fridge.",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            type: "journal",
            mood: 3,
          },
          {
            id: "7",
            title: "Learning New Words",
            content: "Mia said her first full sentence today! 'I love you mama' - my heart just melted. These milestones never get old.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            type: "journal",
            mood: 5,
          },
          {
            id: "8",
            title: "Helping in the Kitchen",
            content: "Oliver helped me bake cookies this afternoon. Sure, there was flour everywhere, but his enthusiasm and joy made it all worth it.",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            type: "journal",
            mood: 4,
          },
          {
            id: "9",
            title: "First Lost Tooth",
            content: "The tooth fairy visits tonight! Ava lost her first tooth and she's so excited. She wrote the cutest letter for the tooth fairy to read.",
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
            type: "journal",
            mood: 5,
          },
          {
            id: "10",
            title: "Playground Adventures",
            content: "Spent the whole afternoon at the park. Watching the kids play, laugh, and explore is a reminder of how simple joy can be.",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            type: "journal",
            mood: 3,
          },
        ];
        
        // Try to load real moments, fall back to sample data
        try {
          const allMoments = await MomentClient.getMoments(user.uid);
          
          if (allMoments && allMoments.length > 0) {
            const transformedMoments = allMoments.map(m => ({
              id: m.id || "",
              title: m.title || m.type || "Untitled",
              content: m.content || "",
              timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp as any),
              type: m.type,
              mood: m.mood,
              emotions: m.emotions,
              attachments: m.attachments,
            }));
            
            setMoments(transformedMoments);
            setFilteredMoments(transformedMoments);
          } else {
            // Use sample data if no real moments
            setMoments(sampleMoments);
            setFilteredMoments(sampleMoments);
          }
        } catch {
          // Use sample data on error
          setMoments(sampleMoments);
          setFilteredMoments(sampleMoments);
        }
      } catch (error) {
        console.error("Failed to load moments:", error);
        toast.error("Failed to load moments");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMoments();
  }, [user]);

  // Filter and sort moments
  useEffect(() => {
    let filtered = [...moments];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(m => m.type === filterType);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case "newest":
          return b.timestamp - a.timestamp;
        case "oldest":
          return a.timestamp - b.timestamp;
        case "mood-high":
          return (b.mood || 0) - (a.mood || 0);
        case "mood-low":
          return (a.mood || 0) - (b.mood || 0);
        default:
          return 0;
      }
    });
    
    setFilteredMoments(filtered);
  }, [moments, searchQuery, filterType, sortType]);

  const handleMomentClick = (moment: any) => {
    if (moment.type === "journal") {
      router.push(`/dashboard/log?edit=${moment.id}`);
    } else {
      // Handle other moment types
      toast.info("Opening moment details...");
    }
  };

  const handleNewMoment = () => {
    router.push("/dashboard/log");
  };

  const filterOptions = [
    { value: "all", label: "All Moments" },
    { value: "journal", label: "Journal" },
    { value: "emotion", label: "Emotions" },
    { value: "voice", label: "Voice" },
    { value: "photo", label: "Photos" },
    { value: "video", label: "Videos" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "mood-high", label: "Best Mood" },
    { value: "mood-low", label: "Lowest Mood" },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-900 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-700 bg-zinc-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-white">Moments</h1>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-zinc-400 hover:text-white"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button 
                onClick={handleNewMoment}
                className="bg-zinc-700 text-white hover:bg-zinc-600 border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Moments
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500 mx-auto mb-4"></div>
              <p className="text-zinc-500">Loading moments...</p>
            </div>
          </div>
        ) : (
          <MomentsList
            moments={filteredMoments}
            onMomentClick={handleMomentClick}
          />
        )}
      </main>
    </div>
  );
}