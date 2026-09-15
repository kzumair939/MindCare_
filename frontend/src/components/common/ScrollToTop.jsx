import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    const pageContents = document.querySelectorAll(".mc-page-content, .mc-authenticated-app, main, .mc-container");
    pageContents.forEach((el) => {
      if (el && typeof el.scrollTop === "number") {
        el.scrollTop = 0;
      }
    });
  }, [pathname]);

  return null;
}
