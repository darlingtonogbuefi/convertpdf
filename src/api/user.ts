// src/api/user.ts

import { authFetch } from "@/lib/authFetch";
import { getBaseUrl } from "@/config/backend";

export async function getUserProfile() {
    const res = await authFetch(`${getBaseUrl()}/api/user/me`);

    if (!res.ok) throw new Error("Failed to load profile");

    return res.json();
}

export async function uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await authFetch(`${getBaseUrl()}/api/user/profile-picture`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    return res.json();
}

export async function getProfilePictureUrl() {
    const res = await authFetch(
        `${getBaseUrl()}/api/user/profile-picture`
    );

    if (!res.ok) {
        throw new Error("Failed to load profile picture");
    }

    return await res.blob();
}