//  src\lib\apiClient.ts


import { getBaseUrl } from "@/config/backend";

export async function apiGet(path: string) {
  return fetch(`${getBaseUrl()}${path}`);
}

export async function apiPost(path: string, body: any) {
  return fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}