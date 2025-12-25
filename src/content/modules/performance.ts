import type { PerformanceMetrics } from '../types';

export interface PerformanceWarning {
  title: string;
  solution: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  totalNodes: number;
  totalImages: number;
  totalScripts: number;
  totalStylesheets: number;
  warnings: PerformanceWarning[];
}

// Performance caching: Cache metrics for 5 seconds
let cachedPerformanceMetrics: ExtendedPerformanceMetrics | null = null;
let lastMetricsCalculationTime: number = 0;
const METRICS_CACHE_DURATION: number = 5000; // 5 seconds

let vitalsObserversInitialized = false;

export const observedVitals: PerformanceMetrics = {
  lcp: null,
  cls: 0,
  fid: null,
  inp: null,
  ttfb: null
};

/**
 * Initialize Web Vitals observers (lazy-loaded, runs only once)
 * Performance optimization: Only initializes when inspector is activated
 */
export function initWebVitals(): void {
  if (vitalsObserversInitialized) return;
  if (!('PerformanceObserver' in window)) return;

  vitalsObserversInitialized = true;

  // LCP Observer
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      try {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          observedVitals.lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        }
      } catch (error) {
        // Silently handle LCP processing errors
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    // LCP observer not supported in this browser
  }

  // CLS Observer
  try {
    const clsObserver = new PerformanceObserver((entryList) => {
      try {
        for (const entry of entryList.getEntries()) {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            observedVitals.cls += layoutShift.value;
          }
        }
      } catch (error) {
        // Silently handle CLS processing errors
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    // CLS observer not supported in this browser
  }

  // FID Observer
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      try {
        const firstInput = entryList.getEntries()[0] as any;
        if (firstInput) {
          observedVitals.fid = firstInput.processingStart - firstInput.startTime;
        }
      } catch (error) {
        // Silently handle FID processing errors
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    // FID observer not supported in this browser
  }

  // INP Observer (Interaction to Next Paint)
  try {
    const inpObserver = new PerformanceObserver((entryList) => {
      try {
        const entries = entryList.getEntries() as any[];
        entries.forEach((entry) => {
          // Only track interactions longer than 40ms (noticeable delays)
          if (entry.duration && entry.duration > 40) {
            if (observedVitals.inp === null || entry.duration > observedVitals.inp) {
              observedVitals.inp = entry.duration;
            }
          }
        });
      } catch (error) {
        // Silently handle INP processing errors
      }
    });
    
    // Use 'event' type for INP tracking
    inpObserver.observe({ 
      type: 'event', 
      buffered: true 
    });
  } catch (error) {
    // INP observer not supported in this browser
  }

  // TTFB Calculation
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      observedVitals.ttfb = navEntry.responseStart - navEntry.requestStart;
    }
  } catch (error) {
    // TTFB not available in this browser
  }
}

/**
 * Get performance metrics with intelligent caching
 * Performance optimization: Results cached for 5 seconds to avoid expensive recalculations
 */
export function getPerformanceMetrics(): ExtendedPerformanceMetrics {
  try {
    const now = Date.now();
    
    // Return cached metrics if still valid (within 5 seconds)
    if (cachedPerformanceMetrics && (now - lastMetricsCalculationTime) < METRICS_CACHE_DURATION) {
      return cachedPerformanceMetrics;
    }

    // Calculate fresh metrics
    const metrics = calculatePerformanceMetrics();
    
    // Cache the result
    cachedPerformanceMetrics = metrics;
    lastMetricsCalculationTime = now;
    
    return metrics;
  } catch (error) {
    console.error('[DevInspect] Performance metrics calculation failed:', error);
    return getEmptyMetrics();
  }
}

/**
 * Clear performance cache (useful when page changes significantly)
 */
export function clearPerformanceCache(): void {
  cachedPerformanceMetrics = null;
  lastMetricsCalculationTime = 0;
}

/**
 * Get empty metrics object (fallback)
 */
function getEmptyMetrics(): ExtendedPerformanceMetrics {
  return {
    lcp: null,
    fid: null,
    cls: 0,
    ttfb: null,
    inp: null,
    totalNodes: 0,
    totalImages: 0,
    totalScripts: 0,
    totalStylesheets: 0,
    warnings: []
  };
}

/**
 * Calculate performance metrics with warnings
 */
function calculatePerformanceMetrics(): ExtendedPerformanceMetrics {
  if (!window.performance) {
    return getEmptyMetrics();
  }

  try {
    const totalNodes = document.querySelectorAll('*').length;
    
    const resources = performance.getEntriesByType('resource') as any[];
    const images = resources.filter(r => r.initiatorType === 'img');
    const scripts = resources.filter(r => r.initiatorType === 'script');
    const stylesheets = resources.filter(r => r.initiatorType === 'link' || r.initiatorType === 'css');
    
    const warnings: PerformanceWarning[] = [];
    
    // Pre-calculate conditions
    const lcpIsBad = observedVitals.lcp !== null && observedVitals.lcp > 2500;
    const clsIsBad = observedVitals.cls !== null && observedVitals.cls > 0.1;
    const ttfbIsBad = observedVitals.ttfb !== null && observedVitals.ttfb > 800;
    const fidIsBad = observedVitals.fid !== null && observedVitals.fid > 100;
    const inpIsBad = observedVitals.inp !== null && observedVitals.inp > 200;
    
    // WARNING 1: Large images (only if LCP is bad AND there are large images > 200KB)
    if (lcpIsBad) {
      const largeImages = images.filter(img => (img.transferSize || 0) > 200000);
      
      if (largeImages.length > 0) {
        const avgSize = (largeImages.reduce((sum: number, img: any) => sum + (img.transferSize || 0), 0) / largeImages.length / 1024).toFixed(0);
        
        warnings.push({
          title: `${largeImages.length} large images detected (avg ${avgSize}KB)`,
          solution: 'Compress images, convert to WebP/AVIF, use responsive images with srcset, implement lazy loading',
          severity: 'high'
        });
      }
    }
    
    // WARNING 2: Layout shifts (CLS)
    if (clsIsBad) {
      warnings.push({
        title: `Poor layout stability (CLS: ${observedVitals.cls.toFixed(3)})`,
        solution: 'Set explicit width/height on images and ads. Reserve space for dynamic content. Avoid inserting content above existing content',
        severity: 'high'
      });
    }
    
    // WARNING 3: Slow server response (TTFB)
    if (ttfbIsBad) {
      const ttfbValue = observedVitals.ttfb as number;
      warnings.push({
        title: `Slow server response time (${ttfbValue.toFixed(0)}ms)`,
        solution: 'Optimize backend queries, use CDN, implement server-side caching, upgrade hosting plan',
        severity: 'medium'
      });
    }

    // WARNING 4: Poor interactivity (FID or INP)
    if (fidIsBad || inpIsBad) {
      const metric = fidIsBad ? `FID: ${observedVitals.fid}ms` : `INP: ${observedVitals.inp}ms`;
      warnings.push({
        title: `Slow interactivity detected (${metric})`,
        solution: 'Reduce JavaScript execution time, break up long tasks, use web workers for heavy computation',
        severity: 'high'
      });
    }
    
    // WARNING 5: Large JavaScript bundles (only if LCP is bad AND scripts > 500KB)
    if (lcpIsBad) {
      const largeScripts = scripts.filter(s => (s.transferSize || 0) > 500000);
      
      if (largeScripts.length > 0) {
        const totalSize = (largeScripts.reduce((sum: number, s: any) => sum + (s.transferSize || 0), 0) / 1024).toFixed(0);
        
        warnings.push({
          title: `Heavy JavaScript detected (${totalSize}KB across ${largeScripts.length} files)`,
          solution: 'Code-split bundles, defer non-critical JS, remove unused dependencies, enable compression',
          severity: 'medium'
        });
      }
    }
    
    // WARNING 6: Missing alt attributes
    const imgsWithoutAlt = document.querySelectorAll('img:not([alt])').length;
    if (imgsWithoutAlt > 0) {
      warnings.push({
        title: `${imgsWithoutAlt} images missing alt attributes`,
        solution: 'Add descriptive alt text to all images for accessibility and SEO',
        severity: 'low'
      });
    }
    
    return {
      lcp: observedVitals.lcp,
      fid: observedVitals.fid,
      cls: observedVitals.cls,
      ttfb: observedVitals.ttfb,
      inp: observedVitals.inp,
      totalNodes,
      totalImages: images.length,
      totalScripts: scripts.length,
      totalStylesheets: stylesheets.length,
      warnings
    };
  } catch (error) {
    console.error('[DevInspect] Error calculating performance metrics:', error);
    return getEmptyMetrics();
  }
}

/**
 * Reset all Web Vitals observers and metrics
 */
export function resetWebVitals(): void {
  try {
    observedVitals.lcp = null;
    observedVitals.cls = 0;
    observedVitals.fid = null;
    observedVitals.inp = null;
    observedVitals.ttfb = null;
    vitalsObserversInitialized = false;
    clearPerformanceCache();
  } catch (error) {
    console.error('[DevInspect] Error resetting Web Vitals:', error);
  }
}
