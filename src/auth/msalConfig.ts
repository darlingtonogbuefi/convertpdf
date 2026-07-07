//   src/auth/msalConfig.ts

export const API_SCOPE =
  import.meta.env.VITE_API_SCOPE ??
  "api://pdf-converter-api/access_as_user";

const KNOWN_AUTHORITY =
  import.meta.env.VITE_AZURE_KNOWN_AUTHORITY ??
  "login.cribr.co.uk";
//"login.microsoftonline.com";

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_SPA_CLIENT_ID!,
    authority: import.meta.env.VITE_AZURE_AUTHORITY!,
    knownAuthorities: [KNOWN_AUTHORITY],

    // IMPORTANT: always return to app root
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI!,

    // IMPORTANT: restores original route after login
    navigateToLoginRequestUrl: true,
  },

  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", API_SCOPE],
};

export const signUpRequest = {
  scopes: ["openid", "profile", API_SCOPE],
  prompt: "create" as const,
};