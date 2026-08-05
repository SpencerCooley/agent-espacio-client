'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInViewportOptions {
  /**
   * Margin around the viewport in pixels. A positive value expands the
   * viewport, keeping elements "in view" longer after scrolling past them.
   * This prevents rapid mount/unmount flicker when scrolling.
   *
   * Default: 200 (keeps element mounted until 200px outside viewport)
   */
  bufferPx?: number;
  /**
   * Once the element has entered the viewport, keep it mounted even if
   * it scrolls back out. Useful for heavy components that should only
   * initialize once.
   *
   * Default: false
   */
  sticky?: boolean;
}

/**
 * Hook that reports whether an element is inside (or near) the viewport.
 *
 * Uses IntersectionObserver with a buffer margin so brief scrolls past an
 * element don't cause rapid mount/unmount cycles.
 */
export function useInViewport<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewportOptions = {}
): [React.RefObject<T | null>, boolean] {
  const { bufferPx = 200, sticky = false } = options;
  const ref = useRef<T | null>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const hasBeenVisibleRef = useRef(false);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const visible = entry.isIntersecting;

      if (sticky) {
        if (visible) {
          hasBeenVisibleRef.current = true;
        }
        setIsInViewport((prev) => prev || visible);
      } else {
        setIsInViewport(visible);
      }
    },
    [sticky]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: `${bufferPx}px`,
      threshold: 0,
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersection, bufferPx]);

  return [ref, isInViewport];
}
