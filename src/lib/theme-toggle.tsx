"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import CircleTheme from "@/components/icons/circle-theme";
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
                <CircleTheme className="h-5 w-5 text-black" />
            ) : (
                <CircleTheme className="h-5 w-5 text-white" />
            )}
        </Button>
    );
}
