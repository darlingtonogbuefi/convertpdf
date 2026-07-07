//  src\auth\ProtectedLayout.tsx

import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

export function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}