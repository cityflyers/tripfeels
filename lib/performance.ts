import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Custom hook to debounce function calls
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => func(...args), delay);
    }) as T,
    [func, delay]
  );
}

/**
 * Custom hook to throttle function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCall.current >= delay) {
        func(...args);
        lastCall.current = now;
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        lastCallTimer.current = setTimeout(() => {
          func(...args);
          lastCall.current = Date.now();
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [func, delay]
  );
}

/**
 * Custom hook for intersection observer to lazy load components
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasIntersected) {
        setIsIntersecting(true);
        setHasIntersected(true);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, hasIntersected]);

  return { elementRef, isIntersecting, hasIntersected };
}

/**
 * Custom hook to memoize expensive calculations
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Utility to create a stable callback reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  private static measures: Map<string, number> = new Map();

  static mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  static measure(name: string, startMark: string, endMark: string): void {
    if (typeof performance !== 'undefined') {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          this.measures.set(name, measure.duration);
        }
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
  }

  static getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  static clearMarks(): void {
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      this.marks.clear();
    }
  }

  static clearMeasures(): void {
    if (typeof performance !== 'undefined') {
      performance.clearMeasures();
      this.measures.clear();
    }
  }
}

/**
 * Image optimization utility
 */
export function optimizeImageUrl(
  url: string,
  width: number,
  height?: number,
  quality: number = 80
): string {
  if (!url) return url;
  
  // If it's already an optimized URL, return as is
  if (url.includes('?') || url.includes('&')) {
    return url;
  }

  const params = new URLSearchParams();
  params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  params.append('q', quality.toString());
  params.append('fit', 'crop');
  params.append('auto', 'format');

  return `${url}?${params.toString()}`;
}

/**
 * Bundle size optimization utility
 */
export function createChunkName(name: string): string {
  return `chunk-${name}`;
}

/**
 * Memory usage optimization
 */
export function cleanupMemory(): void {
  if (typeof window !== 'undefined' && 'gc' in window) {
    // @ts-ignore
    window.gc();
  }
}

// Re-export React hooks for convenience
export { useCallback, useMemo, useRef, useEffect, useState } from 'react';
