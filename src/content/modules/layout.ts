import type { LayoutInfo } from '../types';

/**
 * Detect layout type and properties for an element
 * Detects Flexbox and CSS Grid layouts with their properties
 * @param element - The DOM element to analyze
 * @returns Layout information or null if no special layout detected
 */
export function detectLayout(element: Element): LayoutInfo | null {
  try {
    const style = window.getComputedStyle(element);
    const display = style.display;
    
    // Check for Flexbox
    if (display === 'flex' || display === 'inline-flex') {
      return {
        display: 'flexbox',
        flexDirection: style.flexDirection || 'row',
        justifyContent: style.justifyContent || 'normal',
        alignItems: style.alignItems || 'normal',
        gap: style.gap || '0px'
      };
    }
    
    // Check for Grid
    if (display === 'grid' || display === 'inline-grid') {
      return {
        display: 'grid',
        gridTemplateColumns: style.gridTemplateColumns || 'none',
        gridTemplateRows: style.gridTemplateRows || 'none',
        gap: style.gap || '0px'
      };
    }
    
    // No special layout detected
    return null;
  } catch (error) {
    // Return null if layout detection fails
    return null;
  }
}

/**
 * Generate HTML markup for layout display
 * @deprecated This function is kept for backward compatibility
 * Layout HTML is now generated directly in panel.ts
 * @param layout - Layout information object
 * @returns HTML string for layout display
 */
export function getLayoutHTML(layout: LayoutInfo): string {
  try {
    if (!layout) return '';
    
    if (layout.display === 'flexbox') {
      return generateFlexboxHTML(layout);
    }
    
    if (layout.display === 'grid') {
      return generateGridHTML(layout);
    }
    
    return '';
  } catch (error) {
    return '';
  }
}

/**
 * Generate HTML for Flexbox layout
 */
function generateFlexboxHTML(layout: LayoutInfo): string {
  try {
    const gapHTML = layout.gap && layout.gap !== 'normal' && layout.gap !== '0px' 
      ? `<div class="ff-grid-item">
           <strong>Gap:</strong>
           <span>${layout.gap}</span>
         </div>`
      : '';
    
    return `
      <div class="ff-section">
        <div class="ff-section-header">
          <span>Layout Detection</span>
        </div>
        <div class="ff-grid">
          <div class="ff-grid-item">
            <strong>Display:</strong>
            <span>Flexbox</span>
          </div>
          <div class="ff-grid-item">
            <strong>Direction:</strong>
            <span>${layout.flexDirection || 'row'}</span>
          </div>
          <div class="ff-grid-item">
            <strong>Justify:</strong>
            <span>${layout.justifyContent || 'normal'}</span>
          </div>
          <div class="ff-grid-item">
            <strong>Align:</strong>
            <span>${layout.alignItems || 'normal'}</span>
          </div>
          ${gapHTML}
        </div>
      </div>
    `;
  } catch (error) {
    return '';
  }
}

/**
 * Generate HTML for CSS Grid layout
 */
function generateGridHTML(layout: LayoutInfo): string {
  try {
    const gapHTML = layout.gap && layout.gap !== 'normal' && layout.gap !== '0px'
      ? `<div class="ff-grid-item">
           <strong>Gap:</strong>
           <span>${layout.gap}</span>
         </div>`
      : '';
    
    return `
      <div class="ff-section">
        <div class="ff-section-header">
          <span>Layout Detection</span>
        </div>
        <div class="ff-grid">
          <div class="ff-grid-item">
            <strong>Display:</strong>
            <span>CSS Grid</span>
          </div>
          <div class="ff-grid-item">
            <strong>Columns:</strong>
            <span>${layout.gridTemplateColumns || 'none'}</span>
          </div>
          <div class="ff-grid-item">
            <strong>Rows:</strong>
            <span>${layout.gridTemplateRows || 'none'}</span>
          </div>
          ${gapHTML}
        </div>
      </div>
    `;
  } catch (error) {
    return '';
  }
}
