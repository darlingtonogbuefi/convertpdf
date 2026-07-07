//  src\auth\idleSession.ts

import { msalInstance } from "./authProvider";

const IDLE_TIMEOUT = 20 * 60 * 1000; // 20 min
const WARNING_TIME = 2 * 60 * 1000;  // 2 min before logout

let idleTimer: number | null = null;
let warningTimer: number | null = null;

function logoutUser() {
  const account =
    msalInstance.getActiveAccount() ||
    msalInstance.getAllAccounts()[0];

  // clear app state
  sessionStorage.clear();
  localStorage.removeItem("msal.interaction.status");

  // ✅ FIX: notify UI + hooks before logout
  window.dispatchEvent(new Event("ciam-logout"));

  // multi-tab sync signal
  localStorage.setItem("ciam-logout", Date.now().toString());

  msalInstance.logoutRedirect({
    account,
    postLogoutRedirectUri: "/",
  });
}

function triggerWarning() {
  window.dispatchEvent(new Event("ciam-idle-warning"));
}

function resetTimers() {
  if (idleTimer) window.clearTimeout(idleTimer);
  if (warningTimer) window.clearTimeout(warningTimer);

  warningTimer = window.setTimeout(() => {
    triggerWarning();
  }, IDLE_TIMEOUT - WARNING_TIME);

  idleTimer = window.setTimeout(() => {
    logoutUser();
  }, IDLE_TIMEOUT);
}

export function startIdleMonitor() {
  const events = [
    "mousemove",
    "keydown",
    "click",
    "scroll",
    "touchstart",
  ];

  events.forEach((event) => {
    window.addEventListener(event, resetTimers);
  });

  resetTimers();
}