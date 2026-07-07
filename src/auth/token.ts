// src\auth\token.ts


import { msalInstance } from "./authProvider";
import { API_SCOPE } from "./msalConfig";

/**
 * Optional access token getter:
 * - returns token if user is logged in
 * - returns null if anonymous
 * - never throws
 */
export async function getAccessTokenOptional() {
  try {
    // Get all accounts currently signed in
    const accounts = msalInstance.getAllAccounts();

    // No accounts → anonymous mode
    if (!accounts.length) return null;

    // Acquire token silently for API scope only
    const res = await msalInstance.acquireTokenSilent({
      account: accounts[0],

      // ⚠️ Important: do NOT include loginRequest scopes
      // Only API_SCOPE for backend calls
      scopes: [API_SCOPE],
    });

    return res.accessToken;
  } catch (err) {
    // Silent failure → treat as anonymous user
    console.warn("Silent token acquisition failed:", err);
    return null;
  }
}