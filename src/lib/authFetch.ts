// src/lib/authFetch.ts

import { msalInstance } from "@/auth/authProvider";
import { API_SCOPE } from "@/auth/msalConfig";
import { getGuestId } from "@/utils/guestId";

/**
 * Hybrid fetch:
 * - logged-in → attaches Bearer token
 * - anonymous → sends guest ID if available
 * - never throws for auth reasons
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  try {
    const account =
      msalInstance.getActiveAccount() ||
      msalInstance.getAllAccounts()?.[0];

    // ---------------------------------------------------
    // SINGLE SOURCE OF TRUTH for guest ID
    // (prevents mismatch between storage keys)
    // ---------------------------------------------------
    const guestId = getGuestId();

    // ---------------------------------------------------
    // ANONYMOUS USER → no token, send guest ID
    // ---------------------------------------------------
    if (!account) {
      return fetch(input, {
        ...init,
        credentials: "include",
        headers: {
          ...(init.headers || {}),
          "X-Guest-Id": guestId,
        },
      });
    }

    // ---------------------------------------------------
    // LOGGED-IN USER → attach token + guest ID
    // ---------------------------------------------------
    const tokenResponse = await msalInstance.acquireTokenSilent({
      account,
      scopes: [API_SCOPE],
    });

    return fetch(input, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${tokenResponse.accessToken}`,
        "X-Guest-Id": guestId,
      },
    });
  } catch (err) {
    // ---------------------------------------------------
    // FAIL SAFE: if MSAL breaks, still allow anonymous call
    // ---------------------------------------------------
    console.warn("authFetch fallback to anonymous:", err);

    const guestId = getGuestId();

    return fetch(input, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.headers || {}),
        "X-Guest-Id": guestId,
      },
    });
  }
}