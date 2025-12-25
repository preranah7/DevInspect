import type { SelectorData } from '../types';

/**
 * Generate CSS selector for an element
 * Priority: ID > Classes > nth-child
 */
export function generateCSSSelector(element: Element): string {
  try {
    // If element has ID, use it (most specific)
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }
    
    // Build selector from classes
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        const escapedClasses = classes.map(c => CSS.escape(c)).join('.');
        return `${element.tagName.toLowerCase()}.${escapedClasses}`;
      }
    }
    
    // Fallback to nth-child selector
    return getNthChildSelector(element);
  } catch (error) {
    // Fallback to tag name if selector generation fails
    return element.tagName?.toLowerCase() || 'unknown';
  }
}

/**
 * Generate XPath for an element
 * Uses ID if available, otherwise builds path from root
 */
export function generateXPath(element: Element): string {
  try {
    // Use ID-based XPath if available (most efficient)
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const parts: string[] = [];
    let current: Element | null = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;
      
      // Count preceding siblings with same tag name
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }
      
      const tagName = current.nodeName.toLowerCase();
      const pathIndex = index > 0 ? `[${index + 1}]` : '';
      parts.unshift(`${tagName}${pathIndex}`);
      
      current = current.parentElement;
    }
    
    return parts.length > 0 ? '/' + parts.join('/') : '/html';
  } catch (error) {
    // Fallback XPath
    return `//${element.tagName?.toLowerCase() || 'unknown'}`;
  }
}

/**
 * Get nth-child selector for an element
 * Used as fallback when ID and classes are not available
 */
function getNthChildSelector(element: Element): string {
  try {
    const parent = element.parentElement;
    if (!parent) {
      return element.tagName.toLowerCase();
    }
    
    const children = Array.from(parent.children);
    const index = children.indexOf(element);
    
    if (index === -1) {
      return element.tagName.toLowerCase();
    }
    
    const parentSelector = parent.tagName.toLowerCase();
    const tagName = element.tagName.toLowerCase();
    
    return `${parentSelector} > ${tagName}:nth-child(${index + 1})`;
  } catch (error) {
    return element.tagName?.toLowerCase() || 'unknown';
  }
}

/**
 * Get both CSS and XPath selectors for an element
 */
export function getSelectors(element: Element): SelectorData {
  try {
    return {
      css: generateCSSSelector(element),
      xpath: generateXPath(element)
    };
  } catch (error) {
    // Return fallback selectors
    return {
      css: element.tagName?.toLowerCase() || 'unknown',
      xpath: `//${element.tagName?.toLowerCase() || 'unknown'}`
    };
  }
}
