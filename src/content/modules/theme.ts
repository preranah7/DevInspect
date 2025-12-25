let currentTheme: 'light' | 'dark' = 'light';

/**
 * Initialize theme system with saved preference
 */
export function initTheme(): void {
  try {
    currentTheme = (localStorage.getItem('ff-theme') as 'light' | 'dark') || 'light';
    document.documentElement.setAttribute('data-ff-theme', currentTheme);
  } catch (error) {
    // Fallback to light theme if localStorage fails
    currentTheme = 'light';
    document.documentElement.setAttribute('data-ff-theme', 'light');
  }
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme(): void {
  try {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-ff-theme', currentTheme);
    
    try {
      localStorage.setItem('ff-theme', currentTheme);
    } catch (error) {
      // Ignore localStorage errors (e.g., private browsing mode)
    }
    
    updateThemeIcon();
  } catch (error) {
    console.error('[DevInspect] Theme toggle failed:', error);
  }
}

/**
 * Update theme toggle icon visibility based on current theme
 */
export function updateThemeIcon(): void {
  try {
    const sunIcon = document.querySelector('.ff-sun-icon') as HTMLElement;
    const moonIcon = document.querySelector('.ff-moon-icon') as HTMLElement;
    
    if (sunIcon && moonIcon) {
      if (currentTheme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      }
    }
  } catch (error) {
    // Silently fail if icons not found (panel might not be open)
  }
}

/**
 * Get current theme
 */
export function getCurrentTheme(): 'light' | 'dark' {
  return currentTheme;
}
