"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Input07 from "@/components/ui/password-input";
import Input08 from "@/components/ui/biometric-input";
import { useLock } from "@/context/LockContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Lock, Unlock, Shield, Fingerprint } from "lucide-react";
import { authenticateWithBiometric, setupBiometric, isBiometricSupported, hasBiometricSetup } from "@/lib/webauthn";

interface LockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "set" | "verify" | "unlock";
}

export default function LockDialog({ open, onOpenChange, mode = "verify" }: LockDialogProps) {
  const { setPassword, verifyPassword, unlock, hasPassword } = useLock();
  const { user } = useAuth();
  const [password, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);

  useEffect(() => {
    if (user) {
      setBiometricSupported(isBiometricSupported());
      setBiometricEnabled(hasBiometricSetup(user.uid));
    }
  }, [user]);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasswordInput(password);
  };

  const handleSubmit = async () => {
    if (!password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    if (mode === "set" && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (mode === "set" && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      if (mode === "set") {
        await setPassword(password);
        toast.success("Password set successfully");
        onOpenChange(false);
      } else {
        const isValid = await verifyPassword(password);
        if (isValid) {
          unlock();
          toast.success("App unlocked");
          onOpenChange(false);
        } else {
          toast.error("Incorrect password");
        }
      }
    } catch (error) {
      console.error("Password operation failed:", error);
      toast.error("Operation failed. Please try again.");
    } finally {
      setLoading(false);
      setPasswordInput("");
      setConfirmPassword("");
    }
  };

  const handleBiometricAuth = async () => {
    if (!user) return;
    
    setIsAuthenticating(true);
    try {
      const authenticated = await authenticateWithBiometric(user.uid);
      if (authenticated) {
        unlock();
        toast.success("Unlocked with biometrics");
        onOpenChange(false);
      } else {
        toast.error("Biometric authentication failed");
      }
    } catch (error: any) {
      console.error("Biometric auth error:", error);
      if (error.message.includes("No biometric credential found")) {
        toast.error("Please set up biometric authentication first");
      } else {
        toast.error("Biometric authentication failed");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSetupBiometric = async () => {
    if (!user) return;
    
    try {
      await setupBiometric(user.uid, user.email || "user@soulspect.app");
      setBiometricEnabled(true);
      toast.success("Biometric authentication enabled");
    } catch (error: any) {
      console.error("Biometric setup error:", error);
      toast.error("Failed to set up biometric authentication");
    }
  };

  const getDialogContent = () => {
    switch (mode) {
      case "set":
        return {
          icon: <Shield className="w-6 h-6 text-blue-600" />,
          title: "Set App Password",
          description: "Create a password to secure your Soulspect data. This password will be required to access the app.",
        };
      case "unlock":
        return {
          icon: <Unlock className="w-6 h-6 text-green-600" />,
          title: "Unlock Soulspect",
          description: "Enter your password to access your data.",
        };
      default:
        return {
          icon: <Lock className="w-6 h-6 text-amber-600" />,
          title: "Enter Password",
          description: "Please enter your password to continue.",
        };
    }
  };

  const content = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {content.icon}
            <DialogTitle>{content.title}</DialogTitle>
          </div>
          <DialogDescription>
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Show biometric option for unlock mode if supported and enabled */}
          {mode === "unlock" && biometricSupported && biometricEnabled && (
            <div className="space-y-2">
              <Label>Quick Unlock</Label>
              <Button
                onClick={handleBiometricAuth}
                disabled={isAuthenticating}
                variant="outline"
                className="w-full h-11 justify-start gap-3"
              >
                <Fingerprint className="w-4 h-4" />
                {isAuthenticating ? "Authenticating..." : "Unlock with Touch ID / Face ID"}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or use password</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">
              {mode === "set" ? "New Password" : "Password"}
            </Label>
            {mode === "unlock" && biometricSupported && biometricEnabled ? (
              <Input08
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPasswordInput(e.target.value)}
                onBiometricAuth={handleBiometricAuth}
                showBiometricButton={biometricSupported && biometricEnabled}
                isAuthenticating={isAuthenticating}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
              />
            ) : (
              <Input07
                id="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPasswordInput(e.target.value)}
                showGenerateButton={mode === "set"}
                onGenerate={generatePassword}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && mode !== "set") {
                    handleSubmit();
                  }
                }}
              />
            )}
          </div>

          {mode === "set" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input07
                id="confirmPassword"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
              />
            </div>
          )}

          {mode === "set" && (
            <>
              {biometricSupported && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableBiometric"
                    checked={enableBiometric}
                    onChange={(e) => setEnableBiometric(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableBiometric" className="text-sm cursor-pointer">
                    Enable Touch ID / Face ID for quick unlock
                  </Label>
                </div>
              )}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Please remember this password. There is no way to recover it if forgotten.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await handleSubmit();
              if (mode === "set" && enableBiometric && biometricSupported && user) {
                await handleSetupBiometric();
              }
            }}
            disabled={loading || !password.trim()}
            className="flex-1"
          >
            {loading ? "Loading..." : mode === "set" ? "Set Password" : "Unlock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}