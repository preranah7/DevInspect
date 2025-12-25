/**
 * Type definitions for DevInspect Chrome Extension
 * Central type definitions used across content scripts
 */

/**
 * Global inspection state
 */
export interface InspectionState {
  /** Whether the inspector is currently active */
  isActive: boolean;
  /** Reference to the highlight box overlay element */
  highlightBox: HTMLDivElement | null;
  /** Reference to the inspector panel element */
  panel: HTMLDivElement | null;
}

/**
 * Web Vitals performance metrics
 * Based on Google's Core Web Vitals
 */
export interface PerformanceMetrics {
  /** Largest Contentful Paint (ms) - measures loading performance */
  lcp: number | null;
  /** Cumulative Layout Shift - measures visual stability */
  cls: number;
  /** First Input Delay (ms) - measures interactivity (deprecated) */
  fid: number | null;
  /** Interaction to Next Paint (ms) - measures responsiveness */
  inp: number | null;
  /** Time to First Byte (ms) - measures server response time */
  ttfb: number | null;
}

/**
 * WeakMap cache for computed styles
 * Uses WeakMap for automatic garbage collection
 */
export interface StyleCache extends WeakMap<Element, CSSStyleDeclaration> {}

/**
 * Responsive design analysis data
 */
export interface ResponsiveData {
  /** Current breakpoint name (Mobile, Tablet, Desktop) */
  breakpoint: string;
  /** Color code for breakpoint badge */
  breakpointColor: string;
  /** Human-readable breakpoint range */
  breakpointRange: string;
  /** Current viewport width in pixels */
  width: number;
  /** Whether the page uses CSS media queries */
  mediaQueries: boolean;
  /** Whether the element uses fluid sizing (calc, clamp, %, vw, etc.) */
  fluidSizing: boolean;
  /** Whether the element uses viewport units (vw, vh, vmin, vmax) */
  viewportUnits: boolean;
}

/**
 * CSS layout information (Flexbox or Grid)
 */
export interface LayoutInfo {
  /** Layout type: 'flexbox' or 'grid' */
  display: 'flexbox' | 'grid';
  
  // Flexbox properties
  /** Flex direction (row, column, etc.) */
  flexDirection?: string;
  /** Flexbox justify-content value */
  justifyContent?: string;
  /** Flexbox align-items value */
  alignItems?: string;
  
  // Grid properties
  /** CSS Grid template columns */
  gridTemplateColumns?: string;
  /** CSS Grid template rows */
  gridTemplateRows?: string;
  
  // Common property
  /** Gap between items (works for both Flexbox and Grid) */
  gap?: string;
}

/**
 * Accessibility issue detected on element
 */
export interface AccessibilityIssue {
  /** Type of accessibility issue */
  type: 'touch-target' | 'font-size' | 'aria' | 'contrast';
  /** Severity level of the issue */
  severity: 'error' | 'warning';
  /** Human-readable description of the issue */
  message: string;
}

/**
 * CSS and XPath selectors for an element
 */
export interface SelectorData {
  /** CSS selector string */
  css: string;
  /** XPath selector string */
  xpath: string;
}

/**
 * Box model measurements
 */
export interface BoxModel {
  /** Margin values (top, right, bottom, left) */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Border width values */
  border: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Padding values */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Typography properties
 */
export interface Typography {
  /** Font size (e.g., "16px") */
  fontSize: string;
  /** Font weight (e.g., "400", "bold") */
  fontWeight: string;
  /** Font family stack */
  fontFamily: string;
  /** Line height value */
  lineHeight: string;
  /** Letter spacing value */
  letterSpacing: string;
  /** Text color (RGB/RGBA) */
  color: string;
  /** Text alignment */
  textAlign: string;
}

/**
 * ARIA attributes and accessibility properties
 */
export interface AriaData {
  /** ARIA role attribute */
  role: string;
  /** ARIA label */
  ariaLabel: string;
  /** ARIA labelledby reference */
  ariaLabelledBy: string;
  /** ARIA describedby reference */
  ariaDescribedBy: string;
  /** ARIA hidden state */
  ariaHidden: string;
  /** Tab index for keyboard navigation */
  tabIndex: string;
  /** ARIA live region setting */
  ariaLive: string;
  /** ARIA atomic setting */
  ariaAtomic: string;
}

/**
 * Chrome extension message structure
 */
export interface ExtensionMessage {
  /** Action type to perform */
  action: 'toggleInspector' | 'getState' | 'updateSettings';
  /** Optional data payload */
  data?: any;
}

/**
 * Extension settings/preferences
 */
export interface ExtensionSettings {
  /** Theme preference */
  theme: 'light' | 'dark';
  /** Auto-collapse panel sections */
  autoCollapse: boolean;
  /** Show performance warnings */
  showWarnings: boolean;
}
