//  src\auth\useIdleSession.ts


import { useEffect, useState } from "react";

export function useIdleSession() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const onWarning = () => setShowWarning(true);
    const onLogout = () => setShowWarning(false);

    window.addEventListener("ciam-idle-warning", onWarning);
    window.addEventListener("ciam-logout", onLogout);

    return () => {
      window.removeEventListener("ciam-idle-warning", onWarning);
      window.removeEventListener("ciam-logout", onLogout);
    };
  }, []);

  return { showWarning, setShowWarning };
}