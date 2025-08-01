// components/AIButton.tsx
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
    // Define the brand glow effect with decreased intensity
    const brandGlow = {
        boxShadow: "0 0 10px rgba(255, 240, 200, 0.3), 0 0 20px rgba(255, 240, 200, 0.5)"
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        // Call any existing onClick handler first if it's provided via props
        if (props.onClick) {
            props.onClick(event);
        }
        // Toggle chat pane if handler is provided
        if (onToggleChat) {
            onToggleChat();
        }
    };

    return (
        <button
            className={cn(
                `
                relative
                inline-flex items-center justify-center
                // Responsive sizing for the button
                h-10 w-10 // Default size
                sm:h-12 sm:w-12 // Slightly larger on small screens
                md:h-14 md:w-14 // Medium size on medium screens
                lg:h-16 lg:w-16 // Larger size on large screens
                
                // Styling for the button itself
                bg-transparent
                border-2 border-white/80 // White border with slight transparency
                text-orange-200 // Orange text (for loader)
                rounded-md
                transition-all duration-300
                
                // Hover effects
                hover:border-orange-100
                hover:text-orange-100
                hover:-translate-y-0.5
                active:translate-y-0
                
                // Disabled state
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:shadow-none disabled:hover:transform-none
            `,
                className
            )}
            disabled={loading}
            style={brandGlow} // Apply the custom brand glow style
            onClick={handleClick} // Assign the new click handler
            {...props}
        >
            {loading ? (
                // Loader size adjusted for smaller button
                <Loader2 className="h-5 w-5 animate-spin text-orange-400" /> 
            ) : (
                <Image
                    src="/logo.png" // Path to your image in the public folder
                    alt="AI Logo"
                    // Image dimensions slightly smaller than button to allow for padding/glow
                    width={40} 
                    height={40} 
                    className="object-contain" // Ensures the image fits within the square
                />
            )}
        </button>
    );
}
