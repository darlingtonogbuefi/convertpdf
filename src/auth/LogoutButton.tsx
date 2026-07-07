//  src\auth\LogoutButton.tsx

import { useMsal } from "@azure/msal-react";

export default function LogoutButton() {
  const { instance } = useMsal();

  const logout = () => {
    instance.logoutRedirect();
  };

  return (
    <button onClick={logout}>
      Sign Out
    </button>
  );
}


