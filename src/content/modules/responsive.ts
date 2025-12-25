import type { ResponsiveData } from '../types';

/**
 * Analyze responsive design features of an element
 * Detects breakpoints, media queries, fluid sizing, and viewport units
 * @param element - The DOM element to analyze
 * @returns Responsive design data including breakpoint and features
 */
export function analyzeResponsive(element: Element): ResponsiveData {
  try {
    const width = window.innerWidth;
    const breakpointInfo = getBreakpointInfo(width);
    const mediaQueriesDetected = detectMediaQueries();
    const styles = window.getComputedStyle(element);
    const hasFluidSizing = detectFluidSizing(styles);
    const hasViewportUnits = detectViewportUnits(styles);
    
    return {
      breakpoint: breakpointInfo.name,
      breakpointColor: breakpointInfo.color,
      breakpointRange: breakpointInfo.range,
      width,
      mediaQueries: mediaQueriesDetected,
      fluidSizing: hasFluidSizing,
      viewportUnits: hasViewportUnits
    };
  } catch (error) {
    // Return fallback responsive data on error
    return getFallbackResponsiveData();
  }
}

/**
 * Get breakpoint information based on viewport width
 */
function getBreakpointInfo(width: number): { name: string; color: string; range: string } {
  if (width < 768) {
    return {
      name: 'Mobile',
      color: '#ef4444',
      range: '<768px'
    };
  } else if (width < 1024) {
    return {
      name: 'Tablet',
      color: '#f59e0b',
      range: '768-1024px'
    };
  } else {
    return {
      name: 'Desktop',
      color: '#10b981',
      range: '>1024px'
    };
  }
}

/**
 * Detect if page uses CSS media queries
 * Scans all stylesheets for @media rules
 */
function detectMediaQueries(): boolean {
  try {
    const sheets = Array.from(document.styleSheets).filter(sheet => {
      try {
        // Test if we can access cssRules (will fail for cross-origin sheets)
        return sheet.cssRules !== null;
      } catch {
        return false;
      }
    });

    for (const sheet of sheets) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule.type === CSSRule.MEDIA_RULE) {
            return true;
          }
        }
      } catch {
        // Ignore errors accessing individual rules
      }
    }
    
    return false;
  } catch {
    // Return false if media query detection fails
    return false;
  }
}

/**
 * Detect if element uses fluid sizing techniques
 * Checks for calc(), clamp(), min(), max(), viewport units, and percentages
 */
function detectFluidSizing(styles: CSSStyleDeclaration): boolean {
  try {
    const properties = ['width', 'height', 'fontSize', 'padding', 'margin'];
    
    return properties.some(prop => {
      try {
        const value = styles.getPropertyValue(prop);
        if (!value) return false;
        
        return (
          value.includes('calc') || 
          value.includes('clamp') || 
          value.includes('min(') || 
          value.includes('max(') ||
          value.includes('vw') ||
          value.includes('vh') ||
          value.includes('vmin') ||
          value.includes('vmax') ||
          value.includes('%')
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Detect if element uses viewport units (vw, vh, vmin, vmax)
 */
function detectViewportUnits(styles: CSSStyleDeclaration): boolean {
  try {
    const properties = ['width', 'height', 'fontSize'];
    
    return properties.some(prop => {
      try {
        const value = styles.getPropertyValue(prop);
        if (!value) return false;
        
        return (
          value.includes('vw') || 
          value.includes('vh') || 
          value.includes('vmin') || 
          value.includes('vmax')
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Get fallback responsive data when analysis fails
 */
function getFallbackResponsiveData(): ResponsiveData {
  const width = window.innerWidth || 1024;
  const breakpointInfo = getBreakpointInfo(width);
  
  return {
    breakpoint: breakpointInfo.name,
    breakpointColor: breakpointInfo.color,
    breakpointRange: breakpointInfo.range,
    width,
    mediaQueries: false,
    fluidSizing: false,
    viewportUnits: false
  };
}
