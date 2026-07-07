// src\auth\authProvider.tsx

import { ReactNode, useEffect } from "react";

import {
  PublicClientApplication,
} from "@azure/msal-browser";

import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./msalConfig";

// ✅ NEW: idle + tab sync features
import { startTabSync } from "./tabSync";
import { startIdleMonitor } from "./idleSession";

export const msalInstance =
  new PublicClientApplication(msalConfig);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  // ✅ NEW: initialize session controls once app mounts
  useEffect(() => {
    // multi-tab logout sync
    startTabSync();

    // idle timeout tracking
    startIdleMonitor();
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}