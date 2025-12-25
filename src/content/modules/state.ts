import type { InspectionState, PerformanceMetrics, StyleCache } from '../types';

/**
 * Global state management for DevInspect
 * Manages inspection state, caching, and performance metrics
 */

// Inspection state
export let isActive: boolean = false;
export let highlightBox: HTMLDivElement | null = null;
export let panel: HTMLDivElement | null = null;

// Performance caching
export let cachedPerformanceMetrics: PerformanceMetrics | null = null;
export let lastMetricsCalculationTime: number = 0;
export const METRICS_CACHE_DURATION: number = 5000; // 5 seconds

// Style cache (WeakMap for automatic garbage collection)
export let styleCache: StyleCache = new WeakMap<Element, CSSStyleDeclaration>();

// Web Vitals storage
export const observedVitals: PerformanceMetrics = {
  lcp: null,
  cls: 0,
  fid: null,
  inp: null,
  ttfb: null
};

/**
 * Set inspector active state
 */
export function setActive(active: boolean): void {
  isActive = active;
}

/**
 * Set highlight box element
 */
export function setHighlightBox(box: HTMLDivElement | null): void {
  highlightBox = box;
}

/**
 * Set panel element
 */
export function setPanel(newPanel: HTMLDivElement | null): void {
  panel = newPanel;
}

/**
 * Update cached performance metrics with timestamp
 */
export function setCachedMetrics(metrics: PerformanceMetrics | null): void {
  cachedPerformanceMetrics = metrics;
  lastMetricsCalculationTime = Date.now();
}

/**
 * Clear style cache (forces recomputation of styles)
 */
export function clearStyleCache(): void {
  styleCache = new WeakMap<Element, CSSStyleDeclaration>();
}

/**
 * Clear all cached performance data
 */
export function clearPerformanceCache(): void {
  cachedPerformanceMetrics = null;
  lastMetricsCalculationTime = 0;
}

/**
 * Reset all state to initial values
 */
export function resetState(): void {
  isActive = false;
  highlightBox = null;
  panel = null;
  cachedPerformanceMetrics = null;
  lastMetricsCalculationTime = 0;
  styleCache = new WeakMap<Element, CSSStyleDeclaration>();
  
  // Reset Web Vitals
  observedVitals.lcp = null;
  observedVitals.cls = 0;
  observedVitals.fid = null;
  observedVitals.inp = null;
  observedVitals.ttfb = null;
}
