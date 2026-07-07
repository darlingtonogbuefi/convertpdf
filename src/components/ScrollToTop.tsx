// src/components/ScrollToTop.tsx

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        const id = requestAnimationFrame(() => {
            window.scrollTo(0, 0);
        });

        return () => cancelAnimationFrame(id);
    }, [pathname]);

    return null;
}