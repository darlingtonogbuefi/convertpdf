//  src\auth\migrateGuestToUser.ts
 

import { getBaseUrl } from "@/config/backend";
import { getGuestId } from "@/utils/guestId";
import { msalInstance } from "./authProvider";

export async function migrateGuestToUser() {
  const account =
    msalInstance.getActiveAccount() ||
    msalInstance.getAllAccounts()[0];

  if (!account) return;

  const guestId = getGuestId();
  if (!guestId) return;

  const token = await msalInstance.acquireTokenSilent({
    account,
    scopes: ["api://pdf-converter-api/access_as_user"],
  });

  await fetch(`${getBaseUrl()}/api/conversions/migrate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "X-Guest-Id": guestId,
    },
  });
}