// src/hooks/useConversions.ts

import { useEffect, useState } from "react";
import { getBaseUrl } from "@/config/backend";
import { authFetch } from "@/lib/authFetch";

export interface Conversion {
  id: string;

  status: "completed" | "processing" | "failed" | "pending";

  // ✅ REAL TOOL FROM BACKEND
  conversion_type?: string;

  original_filename: string;
  output_filename?: string; 
  source_format?: string;
  target_format?: string;
  created_date: string;

  file?: {
    url: string;
    name?: string;
  };

  // kept for backward compatibility
  tool_id?: string | null;

  // ---------------------------------------------------
  // NEW: REQUIRED FOR CONVERT PAGE ACTIONS
  // ---------------------------------------------------
  original_blob_path?: string;
  converted_blob_path?: string;
}

export function useConversions() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------
  // LOAD FUNCTION
  // ---------------------------------------------------
  async function load() {
    try {
      // ---------------------------------------------------
      // FIX: ADD IDENTITY (user OR guest)
      // ---------------------------------------------------
      const userRaw = localStorage.getItem("user");
      const guestId = localStorage.getItem("guest_id");

      let url = `${getBaseUrl()}/api/conversions?limit=50&offset=0`;

      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          if (user?.id) {
            url += `&user_id=${user.id}`;
          }
        } catch (e) {
          console.warn("Invalid user JSON in localStorage");
        }
      } else if (guestId) {
        url += `&guest_id=${guestId}`;
      }

      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // ---------------------------------------------------
      // FIX: backend may return items OR conversions
      // ---------------------------------------------------
      const apiData = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.conversions)
          ? data.conversions
          : [];

      const enriched = apiData.map((item: any) => {
        // ---------------------------------------------------
        // Normalize conversion type
        // pdf_split -> pdf-split
        // ---------------------------------------------------
        const conversion_type = item.conversion_type
          ? item.conversion_type.replaceAll("_", "-")
          : undefined;

        // ---------------------------------------------------
        // FILE NORMALIZATION (kept for UI compatibility only)
        // NOT used for blob logic anymore
        // ---------------------------------------------------
        const file =
          item.file?.url
            ? {
                url: item.file.url,
                name:
                  item.file.name ??
                  item.output_filename ??
                  item.original_filename,
              }
            : item.output_filename
              ? {
                  url: item.output_filename,
                  name: item.output_filename,
                }
              : undefined;

        return {
          ...item,

          // normalized backend tool
          conversion_type,

          // backward compatibility
          tool_id: conversion_type ?? null,

          file,

          // ---------------------------------------------------
          // BLOB PATH NORMALIZATION (FIXED)
          // ---------------------------------------------------
          original_blob_path:
            item.original_blob_path ??
            item.input_blob_path ??
            item.source_blob_path ??
            null,

          // ❌ FIX: removed item.file?.url fallback (was incorrect architecture)
          converted_blob_path:
            item.converted_blob_path ??
            item.output_blob_path ??
            item.converted_blob ??
            null,
        };
      });

      setConversions(enriched);
    } catch (err) {
      console.error("Failed to load conversions:", err);
      setConversions([]);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------
  useEffect(() => {
    load();
  }, []);

  // ---------------------------------------------------
  // LIVE SYNC (UNCHANGED)
  // ---------------------------------------------------
  useEffect(() => {
    const sync = () => {
      const localRaw = localStorage.getItem("conversionHistory");

      const localData = localRaw ? JSON.parse(localRaw) : [];

      const normalizedLocal = localData.map((item: any) => ({
        ...item,
        id: String(item.id).startsWith("local-")
          ? item.id
          : `local-${item.id ?? Date.now()}`,
      }));

      setConversions((prev) => {
        const apiOnly = prev.filter(
          (c) => !String(c.id).startsWith("local-")
        );

        return [...apiOnly, ...normalizedLocal];
      });
    };

    window.addEventListener("conversion-history-updated", sync);

    return () =>
      window.removeEventListener("conversion-history-updated", sync);
  }, []);

  async function clearHistory() {
    try {
      const userRaw = localStorage.getItem("user");
      const guestId = localStorage.getItem("guest_id");

      let url = `${getBaseUrl()}/api/conversions`;

      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);

          if (user?.id) {
            url += `?user_id=${user.id}`;
          }
        } catch {}
      } else if (guestId) {
        url += `?guest_id=${guestId}`;
      }

      const response = await authFetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to clear history: ${response.status}`);
      }

      localStorage.removeItem("conversionHistory");

      setConversions([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
      throw err;
    }
  }

  // ---------------------------------------------------
  // REFRESH AFTER MIGRATION (UNCHANGED)
  // ---------------------------------------------------
  useEffect(() => {
    const syncAfterMigration = () => {
      window.location.reload();
    };

    window.addEventListener("guest-migrated", syncAfterMigration);

    return () =>
      window.removeEventListener("guest-migrated", syncAfterMigration);
  }, []);

  return {
    conversions: conversions ?? [],
    loading,
    load,
    clearHistory,
  };
}