// src/components/AuthSuccessToast.tsx

import { useEffect } from "react";
import { toast } from "sonner";

export function AuthSuccessToast() {
  useEffect(() => {
    const showToast =
      sessionStorage.getItem("loginSuccess");

    if (!showToast) return;

    sessionStorage.removeItem("loginSuccess");

    toast.success(
      "Signed in successfully. Please select your file again."
    );
  }, []);

  return null;
}