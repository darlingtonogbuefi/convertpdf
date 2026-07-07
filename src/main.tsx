//  src\main.tsx


import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import {
  AuthProvider,
  msalInstance,
} from "./auth/authProvider";

async function bootstrap() {
  await msalInstance.initialize();

  const result = await msalInstance.handleRedirectPromise();

  // ✅ This is now the ONLY source of truth for login redirect intent
  if (result) {
    sessionStorage.setItem("msalLoginRedirect", "dashboard");
  }

  // optional: restore path if you use it elsewhere
  const redirect = sessionStorage.getItem("postLoginRedirect");

  if (redirect) {
    sessionStorage.removeItem("postLoginRedirect");

    if (window.location.pathname !== redirect) {
      window.history.replaceState(null, "", redirect);
    }
  }

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
}

bootstrap();