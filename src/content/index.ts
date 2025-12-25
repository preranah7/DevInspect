import '../styles/content.css';
import { initTheme } from './modules/theme';
import { initInspector } from './modules/inspector';

/**
 * DevInspect - Professional Frontend Inspection Tool
 * Entry point for content script
 */

(function() {
  'use strict';
  
  try {
    // Initialize theme system (light/dark mode)
    initTheme();
    
    // Initialize element inspector
    initInspector();
    
  } catch (error) {
    console.error('[DevInspect] Initialization failed:', error);
  }
})();
