import { debounce } from './utils';
import { showPanel } from './panel';
import { setActive, setHighlightBox, isActive, highlightBox } from './state';
import { initWebVitals } from './performance';

/**
 * Initialize element inspector with keyboard shortcuts and message listeners
 */
export function initInspector(): void {
  try {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        if (message.action === 'toggleInspect') {
          toggleInspector();
          sendResponse({ isActive: isActive });
        }
      } catch (error) {
        console.error('[DevInspect] Message handler error:', error);
        sendResponse({ isActive: false, error: true });
      }
      return true;
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
  } catch (error) {
    console.error('[DevInspect] Inspector initialization failed:', error);
  }
}

/**
 * Handle keyboard shortcuts (Ctrl+Shift+I to toggle, ESC to close)
 */
function handleKeyboardShortcuts(e: KeyboardEvent): void {
  try {
    // Ctrl+Shift+I: Toggle inspector
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      toggleInspector();
      return;
    }
    
    // ESC: Close inspector and panel
    if (e.key === 'Escape' && isActive) {
      e.preventDefault();
      deactivateInspector();
      
      // Also close panel if open
      const panel = document.getElementById('ff-panel');
      if (panel) {
        panel.remove();
      }
    }
  } catch (error) {
    console.error('[DevInspect] Keyboard shortcut error:', error);
  }
}

/**
 * Toggle inspector on/off
 */
export function toggleInspector(): void {
  try {
    if (isActive) {
      deactivateInspector();
    } else {
      activateInspector();
    }
  } catch (error) {
    console.error('[DevInspect] Toggle inspector error:', error);
    deactivateInspector(); // Failsafe: deactivate on error
  }
}

/**
 * Activate inspector mode
 */
function activateInspector(): void {
  try {
    setActive(true);
    
    // Initialize Web Vitals observers
    initWebVitals();
    
    // Create highlight box
    createHighlightBox();
    
    // Add event listeners
    document.addEventListener('mousemove', debouncedMouseMove);
    document.addEventListener('click', handleClick, true);
    
    // Notify popup of state change
    notifyPopup();
  } catch (error) {
    console.error('[DevInspect] Activation failed:', error);
    deactivateInspector();
  }
}

/**
 * Deactivate inspector mode and clean up
 */
function deactivateInspector(): void {
  try {
    setActive(false);
    
    // Remove highlight box
    if (highlightBox) {
      highlightBox.remove();
      setHighlightBox(null);
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', debouncedMouseMove);
    document.removeEventListener('click', handleClick, true);
    
    // Remove panel if exists
    const panel = document.getElementById('ff-panel');
    if (panel) {
      panel.remove();
    }
    
    // Notify popup of state change
    notifyPopup();
  } catch (error) {
    console.error('[DevInspect] Deactivation error:', error);
  }
}

/**
 * Create highlight box element
 */
function createHighlightBox(): void {
  try {
    const existingBox = document.querySelector('.ff-highlight-box');
    if (existingBox) {
      existingBox.remove();
    }
    
    const box = document.createElement('div');
    box.className = 'ff-highlight-box';
    box.id = 'ff-highlight-box'; // Add ID for easier targeting
    document.body.appendChild(box);
    setHighlightBox(box);
  } catch (error) {
    console.error('[DevInspect] Highlight box creation failed:', error);
  }
}

/**
 * Debounced mousemove handler (16ms = ~60fps)
 */
const debouncedMouseMove = debounce((e: MouseEvent) => {
  handleMouseMove(e);
}, 16);

/**
 * Handle mouse movement to highlight elements
 * OPTIMIZED: Single-pass elementFromPoint with CSS pointer-events (no loops, no blocking)
 * FIXES: Amazon dropdowns, YouTube sidebar, overlapping elements
 */
function handleMouseMove(e: MouseEvent): void {
  if (!isActive || !highlightBox) return;
  
  try {
    // Single pass - Gets TOPMOST element at cursor position
    let target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    
    // Skip own UI in ONE pass only (NO infinite loop)
    if (target && (
      target.id === 'ff-highlight-box' || 
      target.id === 'ff-panel' || 
      target.closest('#ff-panel') ||
      target.closest('.ff-toast') ||
      target.classList.contains('ff-highlight-box')
    )) {
      highlightBox.style.display = 'none';
      return;
    }
    
    if (!target || target === document.body || target === document.documentElement) {
      highlightBox.style.display = 'none';
      return;
    }
    
    // Update highlight box position (smooth 60fps)
    const rect = target.getBoundingClientRect();
    highlightBox.style.display = 'block';
    highlightBox.style.left = `${rect.left + window.scrollX}px`;
    highlightBox.style.top = `${rect.top + window.scrollY}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
    
  } catch (error) {
    console.error('[DevInspect] Mouse move handler error:', error);
  }
}

/**
 * Handle click to inspect element
 * OPTIMIZED: Single-pass elementFromPoint (no loops, no blocking)
 * FIXES: Amazon dropdowns, YouTube sidebar clicks
 */
function handleClick(e: MouseEvent): void {
  if (!isActive) return;
  
  try {
    // Single pass - Gets actual clicked element under overlays
    let target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    
    // Skip own UI in ONE pass only
    if (target && (
      target.id === 'ff-highlight-box' || 
      target.id === 'ff-panel' || 
      target.closest('#ff-panel') ||
      target.closest('.ff-toast') ||
      target.classList.contains('ff-highlight-box')
    )) {
      return;
    }
    
    if (!target || target === document.body || target === document.documentElement) {
      return;
    }
    
    // Prevent default action and show panel
    e.preventDefault();
    e.stopPropagation();
    
    showPanel(target);
    
  } catch (error) {
    console.error('[DevInspect] Click handler error:', error);
  }
}

/**
 * Notify popup of inspector state change
 */
function notifyPopup(): void {
  try {
    chrome.runtime.sendMessage({ 
      action: 'inspectorStateChanged', 
      isActive: isActive 
    }).catch(() => {
      // Popup might not be open, ignore error
    });
  } catch (error) {
    // Silently fail if popup is not available
  }
}
