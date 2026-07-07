// src/auth/ProtectedRoute.tsx

import { Navigate, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

type ProtectedRouteProps = Readonly<{
  children: JSX.Element;
}>;

export function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const { accounts, inProgress } = useMsal();
  const location = useLocation();

  if (inProgress !== "none") {
    return null;
  }

  if (accounts.length === 0) {
    return (
      <Navigate
        to="/"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}