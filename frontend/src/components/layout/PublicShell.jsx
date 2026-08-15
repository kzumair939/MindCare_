import React, { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PublicNav from "./PublicNav";
import Footer from "./Footer";
import useScrollReveal from "../../hooks/useScrollReveal";

export default function PublicShell({ children, hideFooter = false }) {
  const contentRef = useRef(null);
  const { pathname } = useLocation();
  useScrollReveal(contentRef);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="mc-public-app">
      <PublicNav />
      <div className="mc-page-content" ref={contentRef}>
        {children}
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}
