"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, Loader2, Link as LucideLink, CheckCircle, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"] });

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResetData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const { resetPassword } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetData) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setEmailAddress(data.email);
      setEmailSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className={cn("min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100", geist.className)}>
        <div className="flex items-center justify-between p-6">
          <Link 
            href="/login" 
            className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
          
          <button 
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => document.documentElement.classList.toggle("dark")}
          >
            <Moon className="h-4 w-4 block dark:hidden" />
            <Sun className="h-4 w-4 hidden dark:block" />
          </button>
        </div>

        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-6rem)]">
          <div className="w-full max-w-md">
            <Card className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Check your email
                </CardTitle>
                <CardDescription className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  We&apos;ve sent a password reset link to
                  <br />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {emailAddress}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    <strong>Next steps:</strong>
                    <br />
                    1. Check your email (including spam folder)
                    <br />
                    2. Click the reset link
                    <br />
                    3. Create your new password
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setEmailSent(false);
                      setEmailAddress("");
                    }}
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send to different email
                  </Button>

                  <Button
                    asChild
                    className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
                  >
                    <Link href="/login">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Didn&apos;t receive the email?{" "}
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmailAddress("");
                  }}
                  className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-600 dark:hover:text-zinc-400 font-medium underline underline-offset-4"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100", geist.className)}>
      <div className="flex items-center justify-between p-6">
        <Link 
          href="/login" 
          className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>
        
        <button 
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={() => document.documentElement.classList.toggle("dark")}
        >
          <Moon className="h-4 w-4 block dark:hidden" />
          <Sun className="h-4 w-4 hidden dark:block" />
        </button>
      </div>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-6rem)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
              Reset your password
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          <Card className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                    disabled={isLoading}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LucideLink className="w-4 h-4 mr-2" />
                      Send reset link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-600 dark:hover:text-orange-400 font-medium underline underline-offset-4"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}