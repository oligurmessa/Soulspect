"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Github, ArrowRight, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
    showGithub?: boolean;
    showGoogle?: boolean;
    mode?: "signin" | "signup" | "reset";
}

// Validation schemas
const signinSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    displayName: z.string().min(2, "Name must be at least 2 characters"),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const resetSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type SigninData = z.infer<typeof signinSchema>;
type SignupData = z.infer<typeof signupSchema>;
type ResetData = z.infer<typeof resetSchema>;

export default function AuthCard({
    showGithub = true,
    showGoogle = true,
    mode: initialMode = "signin",
    className,
    ...props
}: AuthCardProps) {
    const [mode, setMode] = useState(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, signUp, signInWithGoogle, signInWithGithub, resetPassword } = useAuth();
    const router = useRouter();

    // Form setup based on mode
    const schema = mode === "signin" ? signinSchema : mode === "signup" ? signupSchema : resetSchema;
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<any>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            if (mode === "signin") {
                await signIn(data.email, data.password);
                toast.success("Welcome back!");
                router.push("/dashboard");
            } else if (mode === "signup") {
                await signUp(data.email, data.password, data.displayName);
                toast.success("Account created! Please check your email to verify.");
                router.push("/dashboard");
            } else if (mode === "reset") {
                await resetPassword(data.email);
                toast.success("Password reset email sent!");
                setMode("signin");
                reset();
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            toast.error(error.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: "google" | "github") => {
        setIsLoading(true);
        try {
            if (provider === "google") {
                await signInWithGoogle();
            } else {
                await signInWithGithub();
            }
            toast.success("Welcome!");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Social login error:", error);
            toast.error(error.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const getContent = () => {
        switch (mode) {
            case "signin":
                return {
                    title: "Welcome back",
                    description: "Sign in to your account to continue",
                    buttonText: "Sign in",
                    altText: "Don't have an account?",
                    altAction: "Sign up",
                    altMode: "signup" as const,
                };
            case "signup":
                return {
                    title: "Create an account",
                    description: "Sign up to get started with Soulspect",
                    buttonText: "Create account",
                    altText: "Already have an account?",
                    altAction: "Sign in",
                    altMode: "signin" as const,
                };
            case "reset":
                return {
                    title: "Reset password",
                    description: "Enter your email to receive a reset link",
                    buttonText: "Send reset email",
                    altText: "Remember your password?",
                    altAction: "Sign in",
                    altMode: "signin" as const,
                };
        }
    };

    const content = getContent();

    return (
        <Card
            className={cn(
                "w-[min(100%,420px)] rounded-[2.5rem]",
                "bg-white dark:bg-zinc-900 backdrop-blur-sm",
                "border-0",
                "shadow-2xl shadow-zinc-200/20 dark:shadow-none mx-auto",
                className
            )}
            {...props}
        >
            <CardHeader className="space-y-1 px-4 sm:px-8 pt-8">
                <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-white">
                    {content.title}
                </CardTitle>
                <CardDescription className="text-base text-zinc-500 dark:text-zinc-400">
                    {content.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-8">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid grid-cols-1 gap-4"
                >
                    {mode === "signup" && (
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Name</Label>
                            <Input
                                id="displayName"
                                type="text"
                                placeholder="Enter your name"
                                className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 
                                    border-zinc-200 dark:border-zinc-800
                                    focus:border-zinc-300 dark:focus:border-zinc-700
                                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                disabled={isLoading}
                                {...register("displayName")}
                            />
                            {errors.displayName && (
                                <p className="text-sm text-red-500">{String(errors.displayName?.message || '')}</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 
                                border-zinc-200 dark:border-zinc-800
                                focus:border-zinc-300 dark:focus:border-zinc-700
                                placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            disabled={isLoading}
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{String(errors.email?.message || '')}</p>
                        )}
                    </div>

                    {mode !== "reset" && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                {mode === "signin" && (
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="text-xs p-0 h-auto text-zinc-600 dark:text-zinc-400"
                                        onClick={() => {
                                            setMode("reset");
                                            reset();
                                        }}
                                    >
                                        Forgot password?
                                    </Button>
                                )}
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 
                                    border-zinc-200 dark:border-zinc-800
                                    focus:border-zinc-300 dark:focus:border-zinc-700
                                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                disabled={isLoading}
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{String(errors.password?.message || '')}</p>
                            )}
                        </div>
                    )}

                    {mode === "signup" && (
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 
                                    border-zinc-200 dark:border-zinc-800
                                    focus:border-zinc-300 dark:focus:border-zinc-700
                                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                disabled={isLoading}
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{String(errors.confirmPassword?.message || '')}</p>
                            )}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl
                            bg-zinc-800 dark:bg-zinc-100 
                            hover:opacity-90
                            text-white dark:text-zinc-900
                            transition-all duration-300"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                {content.buttonText}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>

                    {mode !== "reset" && (
                        <>
                            <div className="relative my-1">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-4 text-zinc-400 dark:text-zinc-500 font-medium bg-white dark:bg-zinc-900">
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                {showGoogle && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl h-12 
                                            bg-zinc-50 dark:bg-zinc-800/50
                                            hover:bg-white dark:hover:bg-zinc-800
                                            border-zinc-200 dark:border-zinc-800
                                            hover:border-zinc-300 dark:hover:border-zinc-700"
                                        onClick={() => handleSocialLogin("google")}
                                        disabled={isLoading}
                                    >
                                        <svg
                                            className="mr-2 h-5 w-5"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Google
                                    </Button>
                                )}

                                {showGithub && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl h-12
                                            bg-zinc-50 dark:bg-zinc-800/50
                                            hover:bg-white dark:hover:bg-zinc-800
                                            border-zinc-200 dark:border-zinc-800
                                            hover:border-zinc-300 dark:hover:border-zinc-700"
                                        onClick={() => handleSocialLogin("github")}
                                        disabled={isLoading}
                                    >
                                        <Github className="h-5 w-5 text-zinc-700 dark:text-zinc-300 mr-2" />
                                        GitHub
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </form>
            </CardContent>

            <CardFooter className="px-4 sm:px-8 pb-8 pt-2">
                <div className="text-center w-full text-sm text-zinc-500 dark:text-zinc-400">
                    {content.altText}{" "}
                    <Button
                        variant="link"
                        className="text-zinc-800 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300
                            transition-colors font-medium p-0"
                        onClick={() => {
                            setMode(content.altMode);
                            reset();
                        }}
                        disabled={isLoading}
                    >
                        {content.altAction}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}