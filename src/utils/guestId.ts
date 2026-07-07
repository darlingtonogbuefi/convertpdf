// src/utils/guestId.ts

export function getGuestId(): string {
  let guestId = localStorage.getItem("guestId");

  if (!guestId) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    // IMPORTANT: matches backend expected format
    guestId = `guest_${result}`;

    localStorage.setItem("guestId", guestId);
  }

  return guestId;
}

/**
 * 🧠 IMPORTANT ARCHITECTURE NOTE:
 *
 * This guestId is ONLY for anonymous session tracking.
 *
 * DO NOT USE IT FOR:
 * - conversion history queries
 * - activity dashboard
 * - cross-device sync
 *
 * It is intentionally device-scoped.
 */
export function clearGuestId() {
  localStorage.removeItem("guestId");
}