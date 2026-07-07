// src\App.tsx

import { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useMsal } from "@azure/msal-react";


import TermsOfUsePage from "./pages/TermsOfUsePage";
import PrivacyCookiesPage from "./pages/PrivacyCookiesPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PdfSign from "./pages/pdfsign";
import PdfWatermark from "./pages/pdfwatermark";
import PdfStamperPage from "./pages/pdfstamper";
import PdfEditPage from "./pages/pdf-editor.tsx";

import AboutPage from "./pages/AboutPage.tsx";
import APIPage from "./pages/API.tsx";
import ContactPage from "./pages/Contact.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Convert from "./pages/Convert";

import { AuthSuccessToast } from "@/components/AuthSuccessToast";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { ProtectedLayout } from "@/auth/ProtectedLayout";

// ✅ NEW IMPORT
import { useMigrateGuestToUser } from "@/auth/useMigrateGuestToUser";

const queryClient = new QueryClient();

/* =========================
   LOGIN REDIRECT HANDLER
========================= */

function LoginRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirectTarget = sessionStorage.getItem("msalLoginRedirect");

    if (!redirectTarget) return;

    sessionStorage.removeItem("msalLoginRedirect");

    if (redirectTarget === "dashboard") {
      if (location.pathname !== "/dashboard") {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return null;
}

/* =========================
   APP
========================= */

const App = () => {
  // ✅ NEW: triggers migration once user is ready
  useMigrateGuestToUser();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <AuthSuccessToast />

        <BrowserRouter>
          <ScrollToTop />
          <LoginRedirectHandler />

          <Routes>


            {/* Home */}
            <Route path="/" element={<Index />} />

            {/* PDF tools */}
            <Route path="/pdfsign" element={<PdfSign />} />
            <Route path="/pdfwatermark" element={<PdfWatermark />} />
            <Route path="/pdfstamper" element={<PdfStamperPage />} />
            <Route path="/pdf-editor" element={<PdfEditPage />} />


            {/* Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/api" element={<APIPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* <Route path="/convert" element={<Convert />} /> */}

            {/* LEGAL PAGES */}
            <Route path="/terms" element={<TermsOfUsePage />} />
            <Route path="/privacy" element={<PrivacyCookiesPage />} />

            {/* Protected Dashboard */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/convert" element={<Convert />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;