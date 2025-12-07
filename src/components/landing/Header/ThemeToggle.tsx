"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <Button
            variant="ghost"
            className="cursor-pointer h-8 sm:h-8 text-black dark:text-white transition-colors hover:bg-black/15 dark:hover:bg-white/15 rounded-lg tracking-tighter px-2 py-1"
            onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark");
            }}
        >
            {theme === "light" ? (
                <Moon className="h-5 w-5 text-black" />
            ) : (
                <Sun className="h-5 w-5 text-white" />
            )}
        </Button>
    );
}