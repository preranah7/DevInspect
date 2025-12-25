import { getSelectors } from './selectors';
import { checkAccessibility } from './accessibility';
import { detectLayout } from './layout';
import { analyzeResponsive } from './responsive';
import { getPerformanceMetrics } from './performance';
import { getCachedStyle } from './utils';
import { styleCache, clearStyleCache } from './state';
import { toggleTheme as themeToggle, updateThemeIcon } from './theme';

/**
 * Display inspection panel with element details
 */
export function showPanel(element: Element): void {
  try {
    // Remove existing panel
    const existingPanel = document.getElementById('ff-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    clearStyleCache();

    const panel = createPanelElement();
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'ff-content-wrapper';

    // Gather all element data
    const data = gatherElementData(element);
    
    // Build panel HTML
    contentWrapper.innerHTML = buildPanelHTML(element, data);

    panel.appendChild(contentWrapper);
    document.body.appendChild(panel);

    // Initialize panel features
    makePanelDraggable(panel);
    initCollapsibleSections();
    attachEventListeners(panel, data.selectors);
    updateThemeIcon();

  } catch (error) {
    console.error('[DevInspect] Panel creation failed:', error);
  }
}

/**
 * Create panel element with saved position and state
 */
function createPanelElement(): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'ff-panel';
  panel.className = 'ff-panel';

  try {
    // Restore collapsed state
    const wasPanelCollapsed = localStorage.getItem('ff-panel-collapsed') === 'true';
    if (wasPanelCollapsed) {
      panel.classList.add('ff-panel-collapsed');
    }

    // Restore position
    const savedPosition = localStorage.getItem('ff-panel-position');
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      panel.style.left = pos.left + 'px';
      panel.style.top = pos.top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    } else {
      panel.style.top = '20px';
      panel.style.right = '20px';
    }
  } catch (error) {
    // Fallback to default position on error
    panel.style.top = '20px';
    panel.style.right = '20px';
  }

  return panel;
}

/**
 * Gather all data needed for panel display
 */
function gatherElementData(element: Element) {
  const rect = element.getBoundingClientRect();
  const styles = getCachedStyle(element, styleCache);
  const selectors = getSelectors(element);
  const performance = getPerformanceMetrics();
  const responsive = analyzeResponsive(element);
  const layout = detectLayout(element);
  const a11yIssues = checkAccessibility(element);
  const ariaData = getAriaAttributes(element);
  const boxModel = getBoxModel(element);
  const typography = getTypography(element);

  const classInfo = element.className && typeof element.className === 'string'
    ? `.${element.className.trim().split(/\s+/).join('.')}`
    : '';

  let collapsedSections = {};
  try {
    collapsedSections = JSON.parse(localStorage.getItem('ff-collapsed-sections') || '{}');
  } catch (error) {
    collapsedSections = {};
  }

  return {
    rect,
    styles,
    selectors,
    performance,
    responsive,
    layout,
    a11yIssues,
    ariaData,
    boxModel,
    typography,
    classInfo,
    collapsedSections
  };
}

/**
 * Build complete panel HTML
 */
function buildPanelHTML(element: Element, data: any): string {
  const wasPanelCollapsed = localStorage.getItem('ff-panel-collapsed') === 'true';
  const layoutHTML = buildLayoutHTML(data.layout, data.collapsedSections);
  const warningsHTML = buildWarningsHTML(data.performance.warnings);
  const a11yWarningsHTML = buildA11yWarningsHTML(data.a11yIssues);
  const specificity = calculateSpecificity(data.selectors.css);

  return `
    ${buildHeaderHTML(wasPanelCollapsed)}
    ${buildCompactHeaderHTML(element, data)}
    ${buildPerformanceHTML(data, wasPanelCollapsed)}
    ${warningsHTML}
    ${buildSelectorsHTML(data.selectors, specificity, data.collapsedSections)}
    ${layoutHTML}
    ${buildAccessibilityHTML(data.ariaData, a11yWarningsHTML, data.collapsedSections)}
    ${buildBoxModelHTML(data.boxModel, data.collapsedSections)}
    ${buildTypographyHTML(data.typography, data.collapsedSections)}
  `;
}

/**
 * Build panel header HTML
 */
function buildHeaderHTML(wasPanelCollapsed: boolean): string {
  return `
    <div class="ff-panel-header" id="ff-panel-header">
      <h3 class="ff-panel-title">
        <span class="ff-drag-indicator">⋮⋮</span> Element Inspector
      </h3>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button id="ff-collapse-all" class="ff-collapse-all-btn" title="Collapse panel">
          <span class="ff-collapse-all-icon">${wasPanelCollapsed ? '▶' : '▼'}</span>
        </button>
        <button id="ff-theme-toggle" class="ff-theme-toggle" title="Toggle theme">
          <img class="ff-sun-icon" src="${chrome.runtime.getURL('icons/sun.svg')}" width="18" height="18" alt="Light theme">
          <img class="ff-moon-icon" src="${chrome.runtime.getURL('icons/moon.svg')}" width="18" height="18" alt="Dark theme">
        </button>
        <button id="closePanel" class="ff-close-btn" title="Close (Esc)">×</button>
      </div>
    </div>
  `;
}

/**
 * Build compact header with element info
 */
function buildCompactHeaderHTML(element: Element, data: any): string {
  return `
    <div class="ff-compact-header">
      <div class="ff-compact-tag">
        <span class="ff-compact-tag-name">&lt;${element.tagName.toLowerCase()}&gt;</span>
        <span class="ff-compact-tag-class">${data.classInfo}</span>
      </div>
      
      <div class="ff-compact-grid">
        <div class="ff-compact-item">
          <span class="ff-compact-label">Size</span>
          <span class="ff-compact-value">${Math.round(data.rect.width)} × ${Math.round(data.rect.height)}px</span>
        </div>
        
        <div class="ff-compact-item">
          <span class="ff-compact-label">Position</span>
          <span class="ff-compact-value">${Math.round(data.rect.left)}, ${Math.round(data.rect.top)}</span>
        </div>
        
        <div class="ff-compact-item">
          <span class="ff-compact-label">Display</span>
          <span class="ff-compact-value">${data.styles.display}</span>
        </div>
        
        <div class="ff-compact-item">
          <span class="ff-compact-label">Position Type</span>
          <span class="ff-compact-value">${data.styles.position}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Build performance section HTML
 */
function buildPerformanceHTML(data: any, wasPanelCollapsed: boolean): string {
  const { performance, responsive, collapsedSections } = data;
  
  return `
    <div class="ff-performance-card ff-collapsible-section ${collapsedSections.performance ? 'collapsed' : ''}" data-section="performance">
      <h4 class="ff-section-title ff-collapsible-header">
        <span class="ff-collapse-icon">${collapsedSections.performance ? '▶' : '▼'}</span>
        Web Vitals & Performance
      </h4>
      <div class="ff-collapsible-content">
        <div class="ff-vitals-grid">
          <div class="ff-vital-item ${getVitalStatus(performance.lcp, 2500, 4000)}">
            <div class="ff-vital-label">LCP</div>
            <div class="ff-vital-value">${performance.lcp ? (performance.lcp / 1000).toFixed(2) + 's' : 'N/A'}</div>
            <div class="ff-vital-status">${performance.lcp ? (performance.lcp < 2500 ? 'Good' : performance.lcp < 4000 ? 'Needs Work' : 'Poor') : '-'}</div>
          </div>
          
          <div class="ff-vital-item ${getVitalStatus(performance.cls, 0.1, 0.25, true)}">
            <div class="ff-vital-label">CLS</div>
            <div class="ff-vital-value">${performance.cls !== null ? performance.cls.toFixed(3) : 'N/A'}</div>
            <div class="ff-vital-status">${performance.cls !== null ? (performance.cls < 0.1 ? 'Good' : performance.cls < 0.25 ? 'Needs Work' : 'Poor') : '-'}</div>
          </div>
          
          <div class="ff-vital-item ${getVitalStatus(performance.ttfb, 800, 1800)}">
            <div class="ff-vital-label">TTFB</div>
            <div class="ff-vital-value">${performance.ttfb ? performance.ttfb.toFixed(0) + 'ms' : 'N/A'}</div>
            <div class="ff-vital-status">${performance.ttfb ? (performance.ttfb < 800 ? 'Good' : performance.ttfb < 1800 ? 'Needs Work' : 'Poor') : '-'}</div>
          </div>
          
          <div class="ff-vital-item ff-vital-neutral">
            <div class="ff-vital-label">DOM Size</div>
            <div class="ff-vital-value">${performance.totalNodes || 0}</div>
            <div class="ff-vital-status">${(performance.totalNodes || 0) < 1500 ? 'Good' : 'Large'}</div>
          </div>
        </div>

        <div class="ff-breakpoint-info">
          <span class="ff-breakpoint-badge ff-breakpoint-${responsive.breakpoint.toLowerCase()}">${responsive.breakpoint}: ${responsive.width}px</span>
          <span class="ff-breakpoint-detail ${responsive.mediaQueries ? 'ff-feature-active' : 'ff-feature-inactive'}">${responsive.mediaQueries ? '✓ Responsive' : '✗ Not Responsive'}</span>
          <span class="ff-breakpoint-detail ${responsive.fluidSizing ? 'ff-feature-active' : 'ff-feature-inactive'}">${responsive.fluidSizing ? '✓ Fluid' : '✗ Fixed'}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Build warnings HTML
 */
function buildWarningsHTML(warnings: any[]): string {
  if (warnings.length > 0) {
    return `
      <div class="ff-actionable-warnings">
        ${warnings.map((w: any) => `
          <div class="ff-warning-item ff-warning-${w.severity}">
            <div class="ff-warning-header">
              <span class="ff-warning-title">${w.title}</span>
            </div>
            <div class="ff-warning-solution">${w.solution}</div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    return `
      <div class="ff-success-box" style="margin: 0 24px 16px 24px;">
        <div class="ff-success-text">No performance issues detected</div>
      </div>
    `;
  }
}

/**
 * Build selectors section HTML
 */
function buildSelectorsHTML(selectors: any, specificity: any, collapsedSections: any): string {
  return `
    <div class="ff-selector-card ff-collapsible-section ${collapsedSections.selectors ? 'collapsed' : ''}" data-section="selectors">
      <h4 class="ff-section-title ff-collapsible-header">
        <span class="ff-collapse-icon">${collapsedSections.selectors ? '▶' : '▼'}</span>
        CSS Selector Extractor
      </h4>
      <div class="ff-collapsible-content">
        <div style="margin-bottom:10px;">
          <div class="ff-selector-label">CSS SELECTOR</div>
          <div class="ff-selector-row">
            <div id="cssSelectorText" class="ff-selector-text ff-selector-css">${selectors.css}</div>
            <button class="ff-copy-btn ff-copy-btn-css copy-css-btn">Copy</button>
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <div class="ff-selector-label">XPATH</div>
          <div class="ff-selector-row">
            <div id="xpathText" class="ff-selector-text ff-selector-xpath">${selectors.xpath.length > 60 ? selectors.xpath.substring(0, 60) + '...' : selectors.xpath}</div>
            <button class="ff-copy-btn ff-copy-btn-xpath copy-xpath-btn">Copy</button>
          </div>
        </div>

        <div class="ff-specificity-box">
          <strong>Specificity:</strong> ${specificity.score} <span style="color:var(--ff-text-tertiary);">(${specificity.ids} IDs, ${specificity.classes} classes, ${specificity.elements} elements)</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Build layout detection HTML
 */
function buildLayoutHTML(layout: any, collapsedSections: any): string {
  if (!layout) return '';

  let layoutHTML = '';

  if (layout.display === 'flexbox') {
    layoutHTML += `
      <div class="ff-layout-card ff-flex-container">
        <div class="ff-layout-title ff-flex-title">Flex Container</div>
        <div class="ff-layout-grid">
          <div><span class="ff-layout-label">Direction:</span><br><span class="ff-layout-value">${layout.flexDirection || 'row'}</span></div>
          <div><span class="ff-layout-label">Justify:</span><br><span class="ff-layout-value">${layout.justifyContent || 'normal'}</span></div>
          <div><span class="ff-layout-label">Align:</span><br><span class="ff-layout-value">${layout.alignItems || 'normal'}</span></div>
          <div><span class="ff-layout-label">Gap:</span><br><span class="ff-layout-value">${layout.gap || '0px'}</span></div>
        </div>
      </div>
    `;
  }

  if (layout.display === 'grid') {
    layoutHTML += `
      <div class="ff-layout-card ff-grid-container">
        <div class="ff-layout-title ff-grid-title">Grid Container</div>
        <div style="font-size:11px;">
          <div style="margin-bottom:6px;">
            <span class="ff-layout-label">Columns:</span>
            <span class="ff-layout-value">${layout.gridTemplateColumns || 'none'}</span>
          </div>
          <div>
            <span class="ff-layout-label">Rows:</span>
            <span class="ff-layout-value">${layout.gridTemplateRows || 'none'}</span>
          </div>
        </div>
      </div>
    `;
  }

  if (!layoutHTML) return '';

  return `
    <div class="ff-section-divider ff-collapsible-section ${collapsedSections.layout ? 'collapsed' : ''}" data-section="layout">
      <h4 class="ff-section-title ff-collapsible-header">
        <span class="ff-collapse-icon">${collapsedSections.layout ? '▶' : '▼'}</span>
        Layout Detection
      </h4>
      <div class="ff-collapsible-content">
        ${layoutHTML}
      </div>
    </div>
  `;
}

/**
 * Build accessibility warnings HTML
 */
function buildA11yWarningsHTML(a11yIssues: any[]): string {
  if (a11yIssues.length > 0) {
    return `
      <div class="ff-warning-box">
        <div class="ff-warning-title">Accessibility Issues:</div>
        ${a11yIssues.map(issue => `
          <div style="font-size:11px; margin-bottom:4px; color:var(--ff-text-secondary);">${issue.message}</div>
        `).join('')}
      </div>
    `;
  } else {
    return `
      <div class="ff-success-box">
        <div class="ff-success-text">No accessibility issues detected</div>
      </div>
    `;
  }
}

/**
 * Build accessibility section HTML
 */
function buildAccessibilityHTML(ariaData: any, a11yWarningsHTML: string, collapsedSections: any): string {
  return `
    <div class="ff-section-divider ff-collapsible-section ${collapsedSections.accessibility ? 'collapsed' : ''}" data-section="accessibility">
      <h4 class="ff-section-title ff-collapsible-header">
        <span class="ff-collapse-icon">${collapsedSections.accessibility ? '▶' : '▼'}</span>
        Accessibility
      </h4>
      <div class="ff-collapsible-content">
        <div class="ff-a11y-grid">
          <div>
            <div class="ff-a11y-label">ARIA Role</div>
            <div class="ff-badge">${ariaData.role}</div>
          </div>
          <div>
            <div class="ff-a11y-label">Tab Index</div>
            <div class="ff-badge">${ariaData.tabIndex}</div>
          </div>
          <div style="grid-column: 1 / -1;">
            <div class="ff-a11y-label">ARIA Label</div>
            <div class="ff-badge" style="width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ariaData.ariaLabel}</div>
          </div>
          <div>
            <div class="ff-a11y-label">ARIA Hidden</div>
            <div class="ff-badge ${ariaData.ariaHidden === 'true' ? 'ff-a11y-warning' : ''}">${ariaData.ariaHidden}</div>
          </div>
          <div>
            <div class="ff-a11y-label">ARIA Live</div>
            <div class="ff-badge">${ariaData.ariaLive}</div>
          </div>
        </div>
        
        ${a11yWarningsHTML}
      </div>
    </div>
  `;
}

/**
 * Build box model section HTML
 */
function buildBoxModelHTML(boxModel: any, collapsedSections: any): string {
  return `
    <div class="ff-section-divider ff-collapsible-section ${collapsedSections.boxModel ? 'collapsed' : ''}" data-section="boxModel">
      <h4 class="ff-section-title ff-collapsible-header">
        <span class="ff-collapse-icon">${collapsedSections.boxModel ? '▶' : '▼'}</span>
        Box Model
      </h4>
      <div class="ff-collapsible-content">
        <div class="ff-box-model">
          <div class="ff-box-label">margin</div>
          <div class="ff-box-margin-top">${boxModel.margin.top}px</div>
          <div class="ff-box-grid">
            <div class="ff-box-margin-left">${boxModel.margin.left}px</div>
            <div class="ff-box-border">border</div>
            <div class="ff-box-margin-right">${boxModel.margin.right}px</div>
          </div>
          <div class="ff-box-margin-bottom">${boxModel.margin.bottom}px</div>
        </div>

        <div class="ff-box-details-grid">
          <div>
            <div class="ff-box-detail-label">Padding</div>
            <div class="ff-box-detail-value">${boxModel.padding.top} / ${boxModel.padding.right} / ${boxModel.padding.bottom} / ${boxModel.padding.left}</div>
          </div>
          <div>
            <div class="ff-box-detail-label">Border Width</div>
            <div class="ff-box-detail-value">${boxModel.border.top} / ${boxModel.border.right} / ${boxModel.border.bottom} / ${boxModel.border.left}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Build typography section HTML
 */
function buildTypographyHTML(typography: any, collapsedSections: any): string {
  return `
    <div class="ff-section-divider ff-collapsible-section ${collapsedSections.typography ? 'collapsed' : ''}" data-section="typography" style="padding-bottom: 24px;">
      <h4 class="ff-section-title ff-collapsible-header">
        <span class="ff-collapse-icon">${collapsedSections.typography ? '▶' : '▼'}</span>
        Typography
      </h4>
      <div class="ff-collapsible-content">
        <div class="ff-typo-grid">
          <div>
            <div class="ff-typo-label">Font Size</div>
            <div class="ff-typo-value">${typography.fontSize}</div>
          </div>
          <div>
            <div class="ff-typo-label">Font Weight</div>
            <div class="ff-typo-value">${typography.fontWeight}</div>
          </div>
          <div>
            <div class="ff-typo-label">Line Height</div>
            <div class="ff-typo-value">${typography.lineHeight}</div>
          </div>
          <div>
            <div class="ff-typo-label">Text Align</div>
            <div class="ff-typo-value">${typography.textAlign}</div>
          </div>
          <div class="ff-typo-full">
            <div class="ff-typo-label">Font Family</div>
            <div class="ff-typo-value ff-typo-value-small">${typography.fontFamily}</div>
          </div>
          <div>
            <div class="ff-typo-label">Text Color</div>
            <div class="ff-color-value ff-typo-value">
              <span class="ff-color-swatch" style="background-color: ${typography.color};"></span>
              <span>${rgbToHex(typography.color)}</span>
            </div>
          </div>
          <div>
            <div class="ff-typo-label">Letter Spacing</div>
            <div class="ff-typo-value">${typography.letterSpacing}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach all event listeners to panel elements
 */
function attachEventListeners(panel: HTMLElement, selectors: { css: string; xpath: string }): void {
  try {
    // Close button
    const closeBtn = document.getElementById('closePanel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => panel.remove());
    }

    // Theme toggle
    const themeBtn = document.getElementById('ff-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', themeToggle);
    }

    // Collapse all
    const collapseAllBtn = document.getElementById('ff-collapse-all');
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => togglePanelCollapse(panel));
    }

    // Copy CSS selector
    panel.querySelectorAll('.copy-css-btn').forEach(btn => {
      btn.addEventListener('click', () => copyToClipboard(selectors.css, 'CSS Selector copied!'));
    });

    // Copy XPath
    panel.querySelectorAll('.copy-xpath-btn').forEach(btn => {
      btn.addEventListener('click', () => copyToClipboard(selectors.xpath, 'XPath copied!'));
    });

    // Click on selector text to copy
    const cssSelectorText = document.getElementById('cssSelectorText');
    if (cssSelectorText) {
      cssSelectorText.addEventListener('click', () => copyToClipboard(selectors.css, 'CSS Selector copied!'));
    }

    const xpathText = document.getElementById('xpathText');
    if (xpathText) {
      xpathText.addEventListener('click', () => copyToClipboard(selectors.xpath, 'XPath copied!'));
    }

    // ESC key to close panel
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        panel.remove();
        document.removeEventListener('keydown', handleEscKey);
      }
    };
    document.addEventListener('keydown', handleEscKey);

  } catch (error) {
    console.error('[DevInspect] Event listener attachment failed:', error);
  }
}

/**
 * Copy text to clipboard and show toast
 */
function copyToClipboard(text: string, message: string): void {
  try {
    navigator.clipboard.writeText(text).then(() => {
      showToast(message);
    }).catch(() => {
      showToast('Copy failed');
    });
  } catch (error) {
    showToast('Copy failed');
  }
}

/**
 * Get vital status CSS class
 */
function getVitalStatus(value: number | null, goodThreshold: number, poorThreshold: number, reverse: boolean = false): string {
  if (value === null || value === undefined) return 'ff-vital-neutral';
  
  if (reverse) {
    if (value < goodThreshold) return 'ff-vital-good';
    if (value < poorThreshold) return 'ff-vital-needs-work';
    return 'ff-vital-poor';
  } else {
    if (value < goodThreshold) return 'ff-vital-good';
    if (value < poorThreshold) return 'ff-vital-needs-work';
    return 'ff-vital-poor';
  }
}

/**
 * Calculate CSS selector specificity
 */
function calculateSpecificity(selector: string): { ids: number; classes: number; elements: number; score: string } {
  const idCount = (selector.match(/#[a-zA-Z][a-zA-Z0-9_-]*/g) || []).length;
  const classCount = (selector.match(/\.[a-zA-Z][a-zA-Z0-9_-]*/g) || []).length;
  const pseudoCount = (selector.match(/:[a-zA-Z-]+/g) || []).length;
  const attrCount = (selector.match(/\[[^\]]+\]/g) || []).length;
  const elementCount = (selector.match(/^[a-z]+|\s[a-z]+/gi) || []).length;

  const totalClasses = classCount + pseudoCount + attrCount;

  return {
    ids: idCount,
    classes: totalClasses,
    elements: elementCount,
    score: `${idCount},${totalClasses},${elementCount}`
  };
}

/**
 * Get box model values
 */
function getBoxModel(element: Element): any {
  const styles = window.getComputedStyle(element);
  
  return {
    margin: {
      top: parseFloat(styles.marginTop),
      right: parseFloat(styles.marginRight),
      bottom: parseFloat(styles.marginBottom),
      left: parseFloat(styles.marginLeft)
    },
    border: {
      top: parseFloat(styles.borderTopWidth),
      right: parseFloat(styles.borderRightWidth),
      bottom: parseFloat(styles.borderBottomWidth),
      left: parseFloat(styles.borderLeftWidth)
    },
    padding: {
      top: parseFloat(styles.paddingTop),
      right: parseFloat(styles.paddingRight),
      bottom: parseFloat(styles.paddingBottom),
      left: parseFloat(styles.paddingLeft)
    }
  };
}

/**
 * Get typography values
 */
function getTypography(element: Element): any {
  const styles = window.getComputedStyle(element);
  
  return {
    fontSize: styles.fontSize,
    fontWeight: styles.fontWeight,
    fontFamily: styles.fontFamily,
    lineHeight: styles.lineHeight,
    letterSpacing: styles.letterSpacing,
    color: styles.color,
    textAlign: styles.textAlign
  };
}

/**
 * Get ARIA attributes
 */
function getAriaAttributes(element: Element): any {
  return {
    role: element.getAttribute('role') || 'None',
    ariaLabel: element.getAttribute('aria-label') || 'None',
    ariaLabelledBy: element.getAttribute('aria-labelledby') || 'None',
    ariaDescribedBy: element.getAttribute('aria-describedby') || 'None',
    ariaHidden: element.getAttribute('aria-hidden') || 'false',
    tabIndex: element.getAttribute('tabindex') || 'default',
    ariaLive: element.getAttribute('aria-live') || 'None',
    ariaAtomic: element.getAttribute('aria-atomic') || 'None'
  };
}

/**
 * Convert RGB to HEX
 */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  return rgb;
}

/**
 * Make panel draggable
 */
function makePanelDraggable(panel: HTMLElement): void {
  const header = document.getElementById('ff-panel-header');
  if (!header) return;

  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  header.style.cursor = 'grab';
  header.onmousedown = dragMouseDown;

  function dragMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.preventDefault();
    header!.style.cursor = 'grabbing';
    
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    panel.style.left = rect.left + 'px';
    panel.style.top = rect.top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: MouseEvent) {
    e.preventDefault();
    
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    let newTop = panel.offsetTop - pos2;
    let newLeft = panel.offsetLeft - pos1;
    
    const maxLeft = window.innerWidth - panel.offsetWidth;
    const maxTop = window.innerHeight - panel.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    panel.style.top = newTop + "px";
    panel.style.left = newLeft + "px";
  }

  function closeDragElement() {
    header!.style.cursor = 'grab';
    document.onmouseup = null;
    document.onmousemove = null;
    
    try {
      localStorage.setItem('ff-panel-position', JSON.stringify({
        left: parseInt(panel.style.left),
        top: parseInt(panel.style.top)
      }));
    } catch (error) {
      // Ignore localStorage errors
    }
  }
}

/**
 * Initialize collapsible sections
 */
function initCollapsibleSections(): void {
  try {
    const headers = document.querySelectorAll('.ff-collapsible-header');
    
    headers.forEach(header => {
      (header as HTMLElement).style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const section = (header as HTMLElement).closest('.ff-collapsible-section');
        if (!section) return;

        const sectionName = section.getAttribute('data-section');
        if (!sectionName) return;

        const content = section.querySelector('.ff-collapsible-content') as HTMLElement;
        const icon = header.querySelector('.ff-collapse-icon');
        if (!content || !icon) return;
        
        const isCollapsed = section.classList.toggle('collapsed');
        
        if (isCollapsed) {
          icon.textContent = '▶';
          content.style.maxHeight = '0';
        } else {
          icon.textContent = '▼';
          content.style.maxHeight = content.scrollHeight + 'px';
        }
        
        try {
          const collapsedSections = JSON.parse(localStorage.getItem('ff-collapsed-sections') || '{}');
          collapsedSections[sectionName] = isCollapsed;
          localStorage.setItem('ff-collapsed-sections', JSON.stringify(collapsedSections));
        } catch (error) {
          // Ignore localStorage errors
        }
      });
    });
    
    // Set initial maxHeight for expanded sections
    document.querySelectorAll('.ff-collapsible-section:not(.collapsed) .ff-collapsible-content').forEach(content => {
      (content as HTMLElement).style.maxHeight = (content as HTMLElement).scrollHeight + 'px';
    });
  } catch (error) {
    console.error('[DevInspect] Collapsible sections initialization failed:', error);
  }
}

/**
 * Toggle panel collapse state
 */
function togglePanelCollapse(panel: HTMLElement): void {
  try {
    const collapseBtn = document.getElementById('ff-collapse-all');
    const icon = collapseBtn?.querySelector('.ff-collapse-all-icon');
    if (!icon) return;
    
    const isCollapsed = panel.classList.toggle('ff-panel-collapsed');
    
    if (isCollapsed) {
      icon.textContent = '▶';
    } else {
      icon.textContent = '▼';
    }
    
    localStorage.setItem('ff-panel-collapsed', String(isCollapsed));
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Show toast notification
 */
function showToast(message: string): void {
  try {
    const existingToast = document.querySelector('.ff-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'ff-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2000);
  } catch (error) {
    // Silently fail if toast creation fails
  }
}
