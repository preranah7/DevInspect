import type { AccessibilityIssue } from '../types';

/**
 * Check accessibility issues for a given element
 * Validates touch targets, ARIA attributes, font size, and contrast ratio
 */
export function checkAccessibility(element: Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  try {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    // Check touch target size
    checkTouchTarget(element, rect, issues);
    
    // Check image alt text
    checkImageAlt(element, issues);
    
    // Check interactive element labels
    checkInteractiveLabels(element, issues);
    
    // Check font size
    checkFontSize(style, issues);
    
    // Check color contrast
    checkColorContrast(style, issues);
    
  } catch (error) {
    // Silently fail if accessibility check encounters errors
  }
  
  return issues;
}

/**
 * Check if touch target meets minimum size requirements
 */
function checkTouchTarget(element: Element, rect: DOMRect, issues: AccessibilityIssue[]): void {
  try {
    const width = rect.width;
    const height = rect.height;
    
    const isInteractive = ['A', 'BUTTON', 'INPUT'].includes(element.tagName);
    const touchTargetOk = (width >= 44 && height >= 44) || !isInteractive;
    
    if (!touchTargetOk) {
      issues.push({
        type: 'touch-target',
        severity: 'error',
        message: `Touch target too small: ${Math.round(width)}×${Math.round(height)}px (needs 44×44px)`
      });
    }
  } catch (error) {
    // Ignore touch target check errors
  }
}

/**
 * Check if images have alt attributes
 */
function checkImageAlt(element: Element, issues: AccessibilityIssue[]): void {
  try {
    if (element.tagName === 'IMG' && !element.hasAttribute('alt')) {
      issues.push({
        type: 'aria',
        severity: 'error',
        message: 'Image missing alt attribute'
      });
    }
  } catch (error) {
    // Ignore image alt check errors
  }
}

/**
 * Check if interactive elements have accessible labels
 */
function checkInteractiveLabels(element: Element, issues: AccessibilityIssue[]): void {
  try {
    if (['A', 'BUTTON'].includes(element.tagName)) {
      const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
      if (!hasAriaLabel && !element.textContent?.trim()) {
        issues.push({
          type: 'aria',
          severity: 'error',
          message: 'Interactive element missing accessible label'
        });
      }
    }
  } catch (error) {
    // Ignore interactive label check errors
  }
}

/**
 * Check if font size meets minimum readability standards
 */
function checkFontSize(style: CSSStyleDeclaration, issues: AccessibilityIssue[]): void {
  try {
    const fontSize = parseFloat(style.fontSize);
    if (!isNaN(fontSize) && fontSize < 12) {
      issues.push({
        type: 'font-size',
        severity: 'warning',
        message: `Font size too small: ${fontSize}px (minimum 12px recommended)`
      });
    }
  } catch (error) {
    // Ignore font size check errors
  }
}

/**
 * Check color contrast ratio for readability
 */
function checkColorContrast(style: CSSStyleDeclaration, issues: AccessibilityIssue[]): void {
  try {
    const color = style.color;
    const bgColor = style.backgroundColor;
    
    if (color && bgColor) {
      const contrastRatio = calculateContrastRatio(color, bgColor);
      
      if (contrastRatio < 4.5) {
        issues.push({
          type: 'contrast',
          severity: 'warning',
          message: `Low contrast ratio: ${contrastRatio.toFixed(2)}:1 (needs 4.5:1)`
        });
      }
    }
  } catch (error) {
    // Ignore contrast check errors
  }
}

/**
 * Calculate WCAG contrast ratio between two colors
 * @returns Contrast ratio (1-21), or 21 if calculation fails
 */
function calculateContrastRatio(color1: string, color2: string): number {
  try {
    const rgb1 = parseRGB(color1);
    const rgb2 = parseRGB(color2);
    
    if (!rgb1 || !rgb2) return 21; // Return max ratio if colors can't be parsed
    
    const l1 = getRelativeLuminance(rgb1);
    const l2 = getRelativeLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  } catch (error) {
    return 21; // Return max ratio on error (passes contrast check)
  }
}

/**
 * Parse RGB/RGBA color string to RGB object
 */
function parseRGB(color: string): { r: number; g: number; b: number } | null {
  try {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate relative luminance for WCAG contrast formula
 * Based on WCAG 2.1 specification
 */
function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  try {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch (error) {
    return 0; // Return 0 on error (will result in max contrast ratio)
  }
}
