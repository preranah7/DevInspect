/**
 * Utility functions for DevInspect
 * Common helper functions used across the extension
 */

/**
 * Debounce function to limit function calls
 * Useful for performance-intensive operations like scroll/resize handlers
 * @param func - The function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>): void {
    try {
      const later = () => {
        timeout = null;
        func(...args);
      };
      
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(later, wait);
    } catch (error) {
      // Silently fail if debounce setup fails
    }
  };
}

/**
 * Get cached computed style or compute and cache it
 * Performance optimization: Avoids repeated getComputedStyle calls
 * @param element - The DOM element
 * @param cache - WeakMap cache for storing computed styles
 * @returns Computed CSS style declaration
 */
export function getCachedStyle(
  element: Element,
  cache: WeakMap<Element, CSSStyleDeclaration>
): CSSStyleDeclaration {
  try {
    let style = cache.get(element);
    
    if (!style) {
      style = window.getComputedStyle(element);
      cache.set(element, style);
    }
    
    return style;
  } catch (error) {
    // Fallback: Return fresh computed style without caching
    return window.getComputedStyle(element);
  }
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  try {
    if (!bytes || bytes === 0) return '0 Bytes';
    if (bytes < 0) return '0 Bytes'; // Handle negative values
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // Clamp index to available sizes
    const sizeIndex = Math.min(i, sizes.length - 1);
    
    return Math.round(bytes / Math.pow(k, sizeIndex) * 100) / 100 + ' ' + sizes[sizeIndex];
  } catch (error) {
    return '0 Bytes';
  }
}

/**
 * Check if element is fully visible in viewport
 * @param element - The DOM element to check
 * @returns True if element is completely visible
 */
export function isElementVisible(element: Element): boolean {
  try {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= windowWidth
    );
  } catch (error) {
    return false;
  }
}

/**
 * Check if element is partially visible in viewport
 * @param element - The DOM element to check
 * @returns True if any part of element is visible
 */
export function isElementPartiallyVisible(element: Element): boolean {
  try {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <= windowHeight &&
      rect.left <= windowWidth
    );
  } catch (error) {
    return false;
  }
}

/**
 * Get element's absolute position on the page
 * Includes scroll offset
 * @param element - The DOM element
 * @returns Object with x and y coordinates
 */
export function getAbsolutePosition(element: Element): { x: number; y: number } {
  try {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY
    };
  } catch (error) {
    return { x: 0, y: 0 };
  }
}

/**
 * Safely escape HTML to prevent XSS
 * @param text - Raw text to escape
 * @returns HTML-safe string
 */
export function escapeHTML(text: string): string {
  try {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  } catch (error) {
    return '';
  }
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  try {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  } catch (error) {
    return '';
  }
}

/**
 * Deep clone an object (for simple objects without functions)
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    return obj;
  }
}

/**
 * Throttle function to limit execution rate
 * Different from debounce - executes at most once per interval
 * @param func - Function to throttle
 * @param limit - Minimum time between executions (ms)
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>): void {
    try {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    } catch (error) {
      // Silently fail if throttle execution fails
    }
  };
}
