// src/components/LoginRequiredDialog.tsx

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { authService } from "@/auth/authService";

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginRequiredDialog({
  open,
  onOpenChange,
}: LoginRequiredDialogProps) {
  const handleLogin = async () => {
    try {
      await authService.login(window.location.pathname);
    } catch (err) {
      console.error("Login redirect failed", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          border-2 border-gray-600
          shadow-[0_0_25px_rgba(139,124,246,0.25)]
          rounded-xl
          w-full
          max-w-[420px]
        "
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-black font-bold text-center">
            Sign in required
          </DialogTitle>

          <DialogDescription className="text-gray-900 text-center">
            Files larger than 1MB require a free account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 mt-6">
          {/* Buttons */}
          <div className="flex items-center justify-center gap-3">

            {/* Cancel Button */}
            <Button
              variant="outline"
              className="
                w-[100px]
                h-auto
                px-[10px]
                py-[6px]
                text-[12px]
                leading-[1.1]
                rounded-[4px]
                font-semibold

                bg-gray-100
                text-gray-900

                border border-gray-400

                shadow-[0_4px_10px_rgba(0,0,0,0.10)]

                hover:bg-white
                hover:text-gray-900
                hover:border-gray-400

                active:underline
                focus-visible:underline
              "
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            {/* Sign In Button */}
            <Button
              className="
                w-[100px]
                h-auto
                px-[10px]
                py-[6px]
                text-[12px]
                leading-[1.1]
                rounded-[4px]
                font-semibold

                bg-[#6d5efc]
                text-white

                border border-[rgba(139,124,246,0.6)]

                shadow-[0_4px_10px_rgba(0,0,0,0.15)]

                hover:bg-[#9587ff]

                active:underline
                focus-visible:underline
              "
              onClick={handleLogin}
            >
              Sign In
            </Button>

          </div>

          <span className="text-gray-900 text-sm text-center">
            Sign in to continue your conversion.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}