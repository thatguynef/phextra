/* assets/js/ask-ai.js */

document.addEventListener('DOMContentLoaded', () => {
  // Select ALL buttons with the class 'js-ask-ai-trigger'
  const triggerBtns = document.querySelectorAll('.js-ask-ai-trigger');
  const panel = document.getElementById('ask-ai-panel');
  const closeBtn = document.getElementById('ask-ai-close');
  const expandBtn = document.getElementById('ask-ai-expand');

  // Check if essential elements exist
  if (triggerBtns.length === 0 || !panel || !closeBtn) return;

  // --- Functions ---

  function openPanel() {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    
    // Logic Update: Only lock Body Scroll on Mobile (< 768px)
    // On desktop, we allow the user to scroll the main page content alongside the panel.
    if (window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    }

    // Update state for ALL trigger buttons
    triggerBtns.forEach(btn => {
      btn.classList.add('is-active');
      btn.setAttribute('aria-expanded', 'true');
    });
  }

  function closePanel() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    
    // Always remove the style on close to ensure scrolling is restored if resized
    document.body.style.overflow = '';

    // Update state for ALL trigger buttons
    triggerBtns.forEach(btn => {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function togglePanel() {
    if (panel.classList.contains('is-open')) {
      closePanel();
    } else {
      openPanel();
    }
  }

  // --- Event Listeners ---

  // 1. Loop through all trigger buttons and add click listeners
  triggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent <a> tag navigation
      e.stopPropagation();
      togglePanel();
    });
  });

  // 2. Click on Close X Button
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closePanel();
  });

  // 3. Click on Expand/Collapse Button (Desktop only)
  if (expandBtn) {
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = panel.classList.toggle('is-expanded');

      // Swap the Icon SVG based on state
      if (isExpanded) {
        expandBtn.setAttribute('title', 'Collapse view');
        expandBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>`;
      } else {
        expandBtn.setAttribute('title', 'Expand view');
        expandBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>`;
      }
    });
  }

  // 4. Close on ESC key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) {
      closePanel();
    }
  });
});
