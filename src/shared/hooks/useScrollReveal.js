import { useEffect } from 'react';

/**
 * Reveals every element with a `data-reveal` attribute once it enters the
 * viewport. Falls back to showing everything when motion is reduced or
 * IntersectionObserver is not available.
 */
export default function useScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.setAttribute('data-revealed', 'true'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', 'true');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
}
