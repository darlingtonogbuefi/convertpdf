// src/auth/LoginButton.tsx

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./msalConfig";

export default function LoginButton() {
  const { instance } = useMsal();

  const login = () => {
    // ✅ IMPORTANT: set redirect intent BEFORE redirecting to Azure
    sessionStorage.setItem("msalLoginRedirect", "dashboard");

    instance.loginRedirect(loginRequest);
  };

  return (
    <button onClick={login}>
      Sign In
    </button>
  );
}