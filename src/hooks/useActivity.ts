// src/hooks/useActivity.ts

import { useState, useEffect } from "react";
import { getBaseUrl } from "@/config/backend";
import { authFetch } from "@/lib/authFetch";

export function useActivity() {
  const [activity, setActivity] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [mostUsed, setMostUsed] = useState<any>(null);

  // ✅ NEW: summary state (for Data Processed fix)
  const [summary, setSummary] = useState<any>(null);

  // ---------------------------------------------------
  // EXTRACTED LOAD FUNCTION (so it can be reused)
  // ---------------------------------------------------
  async function load() {
    try {
      const [
        activityRes,
        monthlyRes,
        mostUsedRes,
        summaryRes, // ✅ NEW
      ] = await Promise.all([
        authFetch(`${getBaseUrl()}/api/conversions/activity`),
        authFetch(`${getBaseUrl()}/api/conversions/activity/monthly`),
        authFetch(`${getBaseUrl()}/api/conversions/activity/most-used`),
        authFetch(`${getBaseUrl()}/api/conversions/activity/summary`), // ✅ NEW
      ]);

      // -----------------------------
      // Activity
      // -----------------------------
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivity(activityData);
      } else {
        console.error("Activity failed:", await activityRes.text());
      }

      // -----------------------------
      // Monthly
      // -----------------------------
      if (monthlyRes.ok) {
        setMonthly(await monthlyRes.json());
      } else {
        console.error("Monthly failed:", await monthlyRes.text());
      }

      // -----------------------------
      // Most Used
      // -----------------------------
      if (mostUsedRes.ok) {
        setMostUsed(await mostUsedRes.json());
      } else {
        console.error("Most-used failed:", await mostUsedRes.text());
      }

      // -----------------------------
      // Summary (NEW)
      // -----------------------------
      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      } else {
        console.error("Summary failed:", await summaryRes.text());
      }
    } catch (err) {
      console.error("Failed to load activity:", err);
    }
  }

  // ---------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------
  useEffect(() => {
    load();
  }, []);

  // ---------------------------------------------------
  // REFRESH AFTER GUEST → USER MIGRATION
  // ---------------------------------------------------
  useEffect(() => {
    const refresh = () => load();

    window.addEventListener("guest-migrated", refresh);

    return () => {
      window.removeEventListener("guest-migrated", refresh);
    };
  }, []);

  return {
    activity,
    monthly,
    mostUsed,

    // ✅ NEW: expose summary to dashboard
    summary,
  };
}