// AI button with visible logo in dark mode and cleaner states
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface AIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    onToggleChat?: () => void;
}

export default function AIButton({
    loading = false,
    className,
    onToggleChat,
    ...props
}: AIButtonProps) {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (props.onClick) props.onClick(event);
        if (onToggleChat) onToggleChat();
    };

    return (
        <button
            className={cn(
                "relative group inline-flex items-center justify-center",
                "h-14 w-14 sm:h-16 sm:w-16",
                // keep the button dark in both themes so the (light) logo is visible
                "bg-gradient-to-br from-zinc-950 to-zinc-800",
                "dark:from-zinc-950 dark:to-zinc-800",
                "border border-zinc-700/60 dark:border-zinc-600/70",
                "backdrop-blur-xl rounded-2xl",
                "shadow-lg shadow-black/40",
                "transition-all duration-300 ease-out",
                "hover:scale-105 hover:-translate-y-0.5",
                "hover:shadow-xl hover:shadow-black/50",
                "hover:border-zinc-500 dark:hover:border-zinc-400",
                "active:scale-100 active:translate-y-0",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "disabled:hover:scale-100 disabled:hover:translate-y-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                className
            )}
            disabled={loading}
            onClick={handleClick}
            aria-label="Open AI Assistant"
            {...props}
        >
            {/* subtle glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
                {loading ? (
                    <Loader2
                        className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-zinc-100"
                        strokeWidth={2.5}
                    />
                ) : (
                    <div className="relative">
                        <Image
                            src="/clean_logo.png"
                            alt="AI Logo"
                            width={32}
                            height={32}
                            className="object-contain drop-shadow-[0_0_10px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-110"
                            priority
                        />
                        {/* soft pulse */}
                        <div className="absolute inset-0 rounded-full bg-white/10 scale-0 opacity-0 group-hover:scale-150 group-hover:opacity-100 transition-all duration-500" />
                    </div>
                )}
            </div>

        </button>
    );
}