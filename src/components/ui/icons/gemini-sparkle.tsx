import { cn } from "@/lib/utils"

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string
    strokeWidth?: number
}

export const GeminiSparkle = ({
    className,
    size = 24,
    strokeWidth = 2,
    ...props
}: IconProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("lucide lucide-sparkles", className)}
            {...props}
        >
            <path d="M12 2C12 7.523 16.477 12 22 12C16.477 12 12 16.477 12 22C12 16.477 7.523 12 2 12C7.523 12 12 7.523 12 2Z" />
        </svg>
    )
}
