import React, { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Nav from "./Nav";
import Footer from "./Footer";
import useScrollReveal from "../../hooks/useScrollReveal";

export default function AppShell({ children, hideFooter = true }) {
  const contentRef = useRef(null);
  const { pathname } = useLocation();
  useScrollReveal(contentRef);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="mc-authenticated-app">
      <Nav />
      <div className="mc-page-content" ref={contentRef}>
        {children}
        {!hideFooter && <Footer />}
      </div>
    </div>
  );
}


