//  src\auth\logout.ts

import { msalInstance } from "./authProvider";

export function logout() {
  const account =
    msalInstance.getActiveAccount() ||
    msalInstance.getAllAccounts()[0];

  sessionStorage.clear();
  localStorage.clear();

  msalInstance.logoutRedirect({
    account,
    postLogoutRedirectUri: "/",
  });
}