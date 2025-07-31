"use client";

import { useState } from "react";
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
import { useLock } from "@/context/LockContext";
import { toast } from "sonner";
import { Lock, Unlock, Shield } from "lucide-react";

interface LockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "set" | "verify" | "unlock";
}

export default function LockDialog({ open, onOpenChange, mode = "verify" }: LockDialogProps) {
  const { setPassword, verifyPassword, unlock, hasPassword } = useLock();
  const [password, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
          <div className="space-y-2">
            <Label htmlFor="password">
              {mode === "set" ? "New Password" : "Password"}
            </Label>
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
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Please remember this password. There is no way to recover it if forgotten.
              </p>
            </div>
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
            onClick={handleSubmit}
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