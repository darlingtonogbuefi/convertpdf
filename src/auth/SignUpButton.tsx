// src/auth/SignUpButton.tsx

import { useMsal } from "@azure/msal-react";
import { signUpRequest } from "./msalConfig";

export default function SignUpButton() {
  const { instance } = useMsal();

  const handleSignUp = () => {
    instance.loginRedirect({
      ...signUpRequest,
      extraQueryParameters: {
        prompt: "create",
      },
    });
  };

  return (
    <button
      onClick={handleSignUp}
      className="hover:text-blue-200 transition-colors whitespace-nowrap"
      style={{
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      Sign Up
    </button>
  );
}