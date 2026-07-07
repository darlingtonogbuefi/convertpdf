// src/components/SubpageHeader.tsx

import { useState, useEffect, useRef } from "react";
import { Menu, User } from "lucide-react";
import { motion } from "framer-motion";
import { useMsal } from "@azure/msal-react";
import { loginRequest, signUpRequest } from "../auth/msalConfig";
import { useNavigate, useLocation, Link } from "react-router-dom";

export function SubpageHeader() {
  const [menuOpen, setMenuOpen] = useState(false); // hamburger (mobile + desktop nav)
  const [authMenuOpen, setAuthMenuOpen] = useState(false); // 👈 NEW desktop user dropdown
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const { instance, accounts } = useMsal();
  const isDashboardPage = location.pathname === "/dashboard";
  const isAuthenticated = accounts.length > 0;

  const menuRef = useRef<HTMLDivElement>(null);
  const authRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "API", path: "/api" },
    { label: "Contact Us", path: "/contact" },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    // On dashboard page: remove Home from hamburger menu
    if (isDashboardPage && item.path === "/") return false;

    return item.path !== location.pathname;
  });

  const subtitleMap: Record<string, string> = {
    "/api": "Docs, endpoints, and everything API-related",
    "/contact": "Need help? We actually do respond quickly",
    "/about": "Fix, tweak, and tame your stubborn PDFs",
    "/convert": "Your documents, always within reach.",
    "/dashbaord": "Your documents, under control.",
  };

  const subtitle =
    subtitleMap[location.pathname] || "Your documents, under control.";

  // ---------------- NAVIGATION ----------------
  const handleNavigate = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    setAuthMenuOpen(false);
  };

  // ---------------- MOBILE DETECTION ----------------
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ---------------- CLOSE MENU ON DESKTOP ----------------
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  // ---------------- CLICK OUTSIDE (BOTH MENUS) ----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      if (authRef.current && !authRef.current.contains(target)) {
        setAuthMenuOpen(false);
      }
    };

    if (menuOpen || authMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen, authMenuOpen]);

  // ---------------- LOCK SCROLL ----------------
  useEffect(() => {
    document.body.style.overflow = menuOpen && isMobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, isMobile]);

  // ================= RENDER =================
  return (
    <div>

      {/* MOBILE MENU (UNCHANGED) */}
      <div ref={menuRef} className="absolute inset-0 z-50 pointer-events-none">
        {menuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="
              pointer-events-auto
              fixed top-0 left-0
              w-full h-[310px]
              overflow-y-auto
              z-[99999]
              bg-gradient-to-r from-blue-600 to-purple-600
              flex flex-col items-center
              pt-5 px-2
              md:hidden
            "
          >
            <div className="w-full flex flex-col items-center gap-3">
              {filteredMenuItems.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className="
                    w-[98%]
                    text-sm font-semibold text-white text-left
                    hover:bg-white/20
                    transition-colors duration-200
                    rounded-md
                  "
                >
                  {label}
                </Link>
              ))}

              <button
                onClick={() => {
                  setMenuOpen(false);

                  sessionStorage.setItem("openPopupAfterNav", "1");
                  sessionStorage.setItem("scrollTarget", "hero-top");
                  sessionStorage.setItem("showDropzonePrompt", "1");

                  navigate("/");
                }}


                className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
              >
                Try for Free
              </button>

              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => instance.loginRedirect(loginRequest)}
                    className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() => instance.loginRedirect(signUpRequest)}
                    className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  {/* NEW: Dashboard/Home button */}
                  {isDashboardPage ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/");
                      }}
                      className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
                    >
                      Home
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/dashboard");
                      }}
                      className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
                    >
                      Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => instance.logoutRedirect()}
                    className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
                  >
                    Sign Out
                  </button>
                </>
              )}

              <button
                onClick={() => setMenuOpen(false)}
                className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}

        {/* HAMBURGER BUTTON (UNCHANGED LOGIC) */}
        <div className="absolute left-4 top-4 z-50" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="
              pointer-events-auto
              p-2 rounded-md
              bg-white/20 hover:bg-white/30
              transition-colors duration-200
            "
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          {/* DESKTOP MENU DROPDOWN */}
          {menuOpen && !isMobile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              className="
                pointer-events-auto
                absolute top-full left-0 mt-2 w-40
                rounded-[6px]
                bg-white/20
                shadow-xl
                overflow-hidden
                flex flex-col
                p-1 gap-0.5
                backdrop-blur-md
                
              "
            >
              {filteredMenuItems.map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className="
                  px-3 py-1  
                  text-sm 
                  font-semibold
                  rounded-[4px]
                  text-white 
                  text-right w-38
                  hover:bg-white/20"
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* DESKTOP AUTH → REPLACED WITH USER ICON DROPDOWN */}
      <div className="absolute right-4 top-4 z-50 hidden md:block">
        <div ref={authRef} className="relative">
          <button
            onClick={() => setAuthMenuOpen((p) => !p)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30"
          >
            <User className="w-6 h-6 text-white" />
          </button>

          {authMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              transition-colors duration-200
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              className="
                absolute top-full right-0 mt-2 w-40
                bg-white/20 rounded-[6px] backdrop-blur-md
                shadow-lg leading-tight
                flex flex-col overflow-hidden
                p-1 gap-0.5
              "
            >
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => instance.loginRedirect(loginRequest)}
                    className="px-3 py-1 text-left text-sm text-white rounded-[4px] hover:bg-white/20"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() => instance.loginRedirect(signUpRequest)}
                    className="px-3 py-1 text-left text-sm text-white rounded-[4px] hover:bg-white/20"
                  >
                    Sign Up
                  </button>

                  <button
                    onClick={() => {
                      setAuthMenuOpen(false);

                      sessionStorage.setItem("openPopupAfterNav", "1");
                      sessionStorage.setItem("scrollTarget", "hero-top");

                      navigate("/");
                    }}


                    className="px-3 py-1 text-left text-sm text-white rounded-[4px] hover:bg-white/20"
                  >
                    Try for Free
                  </button>
                </>
              ) : (
                <>
                  {isDashboardPage ? (
                    <button
                      onClick={() => {
                        setAuthMenuOpen(false);
                        navigate("/");
                      }}
                      className="px-3 py-1 text-left text-sm text-white rounded-[4px] hover:bg-white/20"
                    >
                      Home
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setAuthMenuOpen(false);
                        navigate("/dashboard");
                      }}
                      className="px-3 py-1 text-left text-sm text-white rounded-[4px] hover:bg-white/20"
                    >
                      Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setAuthMenuOpen(false);

                      sessionStorage.setItem("openPopupAfterNav", "1");
                      sessionStorage.setItem("scrollTarget", "hero-top");

                      navigate("/");
                    }}

                    
                    className="px-3 py-1 text-left text-sm text-white rounded-[4px] hover:bg-white/20"
                  >
                    Try for Free
                  </button>

                  <button
                    onClick={() => instance.logoutRedirect()}
                    className="px-3 py-1 text-left text-sm text-white rounded-[4px] hover:bg-white/20"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* HEADER (UNCHANGED) */}
      <motion.header
        animate={{
          opacity: 1,
          height: "192px",
          paddingTop: isMobile ? "2.7rem" : "3.2rem",
          paddingBottom: "2rem",
          pointerEvents: "auto",
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="
          relative z-40 overflow-hidden
          bg-gradient-to-r from-blue-600 to-purple-600
          text-white
          flex flex-col items-center justify-center
        "
      >
        <button
          onClick={() => handleNavigate("/")}
          className="flex flex-col items-center justify-center z-50"
        >
          <div className="bg-white/20 rounded-xl p-3 mb-3">
            <img
              src="/android-chrome-512x512.png"
              alt="Logo"
              className="w-7 h-7 object-contain scale-150"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold">CönvertPĐF</h1>
        </button>

        <p className="text-blue-100 mt-2 text-center px-4">{subtitle}</p>
      </motion.header>
    </div>
  );
}