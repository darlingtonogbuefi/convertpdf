//  src\auth\tabSync.ts

import { msalInstance } from "./authProvider";

export function startTabSync() {
  window.addEventListener("storage", (event) => {
    if (event.key === "ciam-logout") {
      window.dispatchEvent(new Event("ciam-logout"));

      const account =
        msalInstance.getActiveAccount() ||
        msalInstance.getAllAccounts()[0];

      msalInstance.logoutRedirect({
        account,
        postLogoutRedirectUri: "/",
      });
    }
  });
}