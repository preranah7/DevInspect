/**
 * DevInspect Popup Script
 * Manages the extension popup UI and communication with content scripts
 */

document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggleBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const btnText = toggleBtn?.querySelector('.btn-text');
  const versionDisplay = document.getElementById('versionDisplay');
  const docsLink = document.getElementById('docsLink');
  const issueLink = document.getElementById('issueLink');
  
  let isActive = false;

  // Initialize popup
  initializePopup();

  /**
   * Initialize popup with version and links
   */
  function initializePopup() {
    try {
      // Load version from manifest
      const manifest = chrome.runtime.getManifest();
      if (versionDisplay && manifest.version) {
        versionDisplay.textContent = `v${manifest.version}`;
      }

      // Set footer links (update these URLs to your actual repo)
      if (docsLink) {
        docsLink.href = 'https://github.com/yourusername/devinspect#readme';
      }
      if (issueLink) {
        issueLink.href = 'https://github.com/yourusername/devinspect/issues';
      }

      // Check initial status
      checkPageCompatibility();
    } catch (error) {
      // Silently fail initialization errors
    }
  }

  /**
   * Check if current page is compatible with DevInspect
   */
  function checkPageCompatibility() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs || !tabs[0]) {
          showError('Unable to access current tab');
          return;
        }
        
        const url = tabs[0].url;
        
        // Check for restricted pages
        if (isRestrictedPage(url)) {
          showError('Not available on this page');
          toggleBtn.disabled = true;
          toggleBtn.style.opacity = '0.5';
          toggleBtn.style.cursor = 'not-allowed';
          return;
        }

        // Page is compatible
        updateStatusText('Ready', false);
      });
    } catch (error) {
      showError('Error checking page compatibility');
    }
  }

  /**
   * Check if URL is a restricted page
   */
  function isRestrictedPage(url) {
    if (!url) return true;
    
    const restrictedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'edge://',
      'about:',
      'view-source:',
      'data:',
      'file:///'
    ];
    
    return restrictedPrefixes.some(prefix => url.startsWith(prefix));
  }

  /**
   * Toggle inspection mode
   */
  toggleBtn?.addEventListener('click', function() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs || !tabs[0]) {
          showError('Unable to access current tab');
          return;
        }
        
        const url = tabs[0].url;
        
        // Double-check restricted pages
        if (isRestrictedPage(url)) {
          showError('Not available on this page');
          return;
        }
        
        // Send message to content script
        chrome.tabs.sendMessage(
          tabs[0].id, 
          { action: 'toggleInspect' }, 
          handleContentScriptResponse
        );
      });
    } catch (error) {
      showError('Error toggling inspector');
    }
  });

  /**
   * Handle response from content script
   */
  function handleContentScriptResponse(response) {
    try {
      if (chrome.runtime.lastError) {
        handleContentScriptError();
        return;
      }
      
      if (response && typeof response.isActive === 'boolean') {
        isActive = response.isActive;
        updateUI();
      } else {
        showError('Unexpected response from page');
      }
    } catch (error) {
      showError('Error processing response');
    }
  }

  /**
   * Handle content script communication errors
   */
  function handleContentScriptError() {
    const errorMessage = chrome.runtime.lastError?.message || 'Unknown error';
    
    // Content script not loaded yet
    if (errorMessage.includes('Could not establish connection') || 
        errorMessage.includes('Receiving end does not exist')) {
      showError('Please reload the page', true);
    } else {
      showError('Communication error');
    }
  }

  /**
   * Update UI based on inspection state
   */
  function updateUI() {
    try {
      if (!statusDot || !statusText || !toggleBtn || !btnText) return;

      if (isActive) {
        statusDot.classList.add('active');
        statusText.textContent = 'Inspecting';
        statusText.style.color = '';
        toggleBtn.classList.add('active');
        btnText.textContent = 'Stop Inspecting';
      } else {
        statusDot.classList.remove('active');
        statusText.textContent = 'Ready';
        statusText.style.color = '';
        toggleBtn.classList.remove('active');
        btnText.textContent = 'Start Inspecting';
      }
    } catch (error) {
      // Silently fail UI update errors
    }
  }

  /**
   * Show error message in status
   * @param {string} message - Error message to display
   * @param {boolean} temporary - If true, revert to 'Ready' after 2 seconds
   */
  function showError(message, temporary = false) {
    try {
      if (!statusText) return;

      statusText.textContent = message;
      statusText.style.color = '#dc2626';
      
      if (temporary) {
        setTimeout(() => {
          updateStatusText('Ready', false);
        }, 2000);
      }
    } catch (error) {
      // Silently fail error display
    }
  }

  /**
   * Update status text
   * @param {string} text - Status text
   * @param {boolean} isError - Whether this is an error state
   */
  function updateStatusText(text, isError = false) {
    try {
      if (!statusText) return;

      statusText.textContent = text;
      statusText.style.color = isError ? '#dc2626' : '';
    } catch (error) {
      // Silently fail status update
    }
  }

  /**
   * Handle keyboard shortcuts (optional enhancement)
   */
  document.addEventListener('keydown', function(e) {
    try {
      // Ctrl+Shift+I or Cmd+Shift+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        toggleBtn?.click();
      }
    } catch (error) {
      // Silently fail keyboard shortcut errors
    }
  });
});
