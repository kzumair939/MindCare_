import { useEffect } from "react";

/**
 * Attaches an IntersectionObserver to all .mc-scroll-reveal elements
 * within the given container ref (or document if no ref provided).
 * Adds .mc-visible when the element enters the viewport.
 */
export default function useScrollReveal(containerRef) {
  useEffect(() => {
    const root = containerRef?.current || document;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("mc-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );

    const observeExisting = () => {
      const els = root.querySelectorAll ? root.querySelectorAll(".mc-scroll-reveal") : [];
      els.forEach((el) => {
        if (!el.classList.contains("mc-visible")) {
          observer.observe(el);
        }
      });
    };

    observeExisting();

    const mutationObserver = new MutationObserver(() => {
      observeExisting();
    });

    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef]);
}
