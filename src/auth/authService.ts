// src/auth/authService.ts

// src/auth/authService.ts

import { msalInstance } from "./authProvider";
import { loginRequest, API_SCOPE } from "./msalConfig";

export const authService = {
  isLoggedIn(): boolean {
    return msalInstance.getAllAccounts().length > 0;
  },

  getAccount() {
    return msalInstance.getAllAccounts()[0] ?? null;
  },

  async getAccessToken(): Promise<string> {
    const account =
      msalInstance.getActiveAccount() ??
      msalInstance.getAllAccounts()[0];

    if (!account) {
      throw new Error("No authenticated user");
    }

    const response = await msalInstance.acquireTokenSilent({
      account,
      scopes: [API_SCOPE],
    });

    return response.accessToken;
  },

  login(redirectPath?: string) {
    // store where user should return after login
    if (redirectPath) {
      sessionStorage.setItem(
        "postLoginRedirect",
        redirectPath
      );
    }

    return msalInstance.loginRedirect(loginRequest);
  },

  logout() {
    sessionStorage.removeItem("postLoginRedirect");
    sessionStorage.removeItem("pendingUpload");

    return msalInstance.logoutRedirect();
  },
};