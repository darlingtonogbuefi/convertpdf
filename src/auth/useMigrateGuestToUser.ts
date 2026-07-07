//  src\auth\useMigrateGuestToUser.ts



import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { migrateGuestToUser } from "./migrateGuestToUser";

const MIGRATION_KEY = "guest_migration_done";

export function useMigrateGuestToUser() {
  const { accounts, inProgress } = useMsal();

  useEffect(() => {
    // wait for MSAL to finish initializing
    if (inProgress !== "none") return;

    // must be logged in
    if (!accounts || accounts.length === 0) return;

    // prevent duplicate runs across refreshes
    if (sessionStorage.getItem(MIGRATION_KEY)) return;

    let cancelled = false;

    const run = async () => {
      try {
        await migrateGuestToUser();

        if (!cancelled) {
          sessionStorage.setItem(MIGRATION_KEY, "1");
        }
      } catch (err) {
        console.warn("Guest migration failed:", err);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [accounts, inProgress]);
}