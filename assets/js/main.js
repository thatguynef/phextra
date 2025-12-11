/**
 * assets/js/main.js
 * Organized by functionality with centralized config.
 */

// 1. Configuration & Constants
const CONFIG = {
  paths: {
    searchIndex: '/index.json',
  },
  storage: {
    theme: 'hugo-theme-mode',
    newsletter: 'hugo-newsletter-subscribed',
    bannerPrefix: 'hugo-banner-closed-',
  },
  selectors: {
    themeToggle: '.theme-toggle-btn', // generic class if you add one later
    mobileMenuBtn: '#mobile-menu-btn',
    mobileOverlay: '.mobile-nav-overlay',
  }
};

// 2. Global Helpers
window.App = {
  // Theme Toggle Logic
  cycleTheme: function() {
    const current = window.__theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    
    // 1. Save Preference
    localStorage.setItem(CONFIG.storage.theme, next);
    window.__theme = next;

    // 2. Apply Class
    const html = document.documentElement;
    if (next === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // 3. Update UI
    // FIX: Use 'window.App' instead of 'this' to avoid context loss
    window.App.updateThemeUI();
  },

  updateThemeUI: function() {
    const pref = window.__theme || 'dark';
    
    // FIX: Use querySelectorAll to handle all instances (if you have mobile duplicates)
    const suns = document.querySelectorAll('.theme-icon-sun');
    const moons = document.querySelectorAll('.theme-icon-moon');

    if (pref === 'dark') {
      // Dark Mode: Show Moon, Hide Sun
      moons.forEach(el => el.classList.remove('hidden'));
      suns.forEach(el => el.classList.add('hidden'));
    } else {
      // Light Mode: Show Sun, Hide Moon
      suns.forEach(el => el.classList.remove('hidden'));
      moons.forEach(el => el.classList.add('hidden'));
    }
  }
};

// Bind to window so onclick="cycleTheme()" works
window.cycleTheme = window.App.cycleTheme;

// 3. Modules
const Modules = {
  
  /**
   * Mobile Navigation
   * Handles opening/closing the mobile menu overlay
   */
  mobileNav: () => {
    const menuBtn = document.querySelector(CONFIG.selectors.mobileMenuBtn);
    const html = document.documentElement;
    const body = document.body;

    if (!menuBtn) return;

    // Toggle Open/Close
    menuBtn.addEventListener('click', () => {
      body.classList.toggle('mobile-nav-open');
      html.classList.toggle('mobile-nav-open');
    });

    // Close when clicking a link inside
    const mobileLinks = document.querySelectorAll(`${CONFIG.selectors.mobileOverlay} a`);
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        body.classList.remove('mobile-nav-open');
        html.classList.remove('mobile-nav-open');
      });
    });
  },

  /**
   * Search Logic
   * Loads FlexSearch index on focus and handles input
   */
  search: () => {
        document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); 
        const isMobile = document.body.classList.contains('mobile-nav-open');
        const target = isMobile 
          ? document.getElementById('search-input-mobile') 
          : document.getElementById('search-input-desktop');
        if (target) target.focus();
      }
    });
    const inputs = [
      { input: document.getElementById('search-input-desktop'), results: document.getElementById('search-results-desktop') },
      { input: document.getElementById('search-input-mobile'),  results: document.getElementById('search-results-mobile') }
    ];

    // Filter out missing elements
    const activeInputs = inputs.filter(pair => pair.input && pair.results);
    if (activeInputs.length === 0) return;

    let index = null;
    let isLoaded = false;
    let isLoading = false; // Prevent multiple fetches

    async function loadIndex() {
      if (isLoaded || isLoading) return;
      isLoading = true;

      if (typeof FlexSearch === 'undefined') {
        console.error('FlexSearch library not loaded. Check baseof.html script tags.');
        return;
      }

      try {
        console.log("Fetching search index...");
        // Ensure this path matches the 'baseName' in hugo.toml + .json
        const response = await fetch(CONFIG.paths.searchIndex); 
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Loaded ${data.length} documents for search.`);
        
        index = new FlexSearch.Document({
          document: {
            id: 'id',
            index: ['title', 'content'],
            store: ['title', 'url', 'section']
          },
          tokenize: 'forward'
        });
        
        // Explicitly add items by ID to ensure stability
        data.forEach(item => {
          index.add(item.id, item);
        });
        
        isLoaded = true;
        isLoading = false;
      } catch (err) {
        console.error("Failed to load search index:", err);
        isLoading = false;
      }
    }

    activeInputs.forEach(pair => {
      const { input, results } = pair;

      // Load index on focus (desktop) or touch (mobile)
      input.addEventListener('focus', loadIndex);
      input.addEventListener('touchstart', loadIndex, { passive: true });

      // Search on input
      input.addEventListener('input', () => {
        if (!isLoaded || !index) return;
        
        const query = input.value.trim();
        if (query.length < 2) {
          results.classList.remove('active');
          results.innerHTML = '';
          return;
        }

        // FlexSearch Search
        const searchResult = index.search(query, { limit: 10, enrich: true });
        
        // Deduplicate results (FlexSearch returns separate arrays for title matches vs content matches)
        let uniqueResults = new Map();
        
        searchResult.forEach(field => {
          field.result.forEach(doc => {
            // doc.doc contains the stored fields (title, url, section)
            if (!uniqueResults.has(doc.id)) {
              uniqueResults.set(doc.id, doc.doc);
            }
          });
        });

        renderResults(Array.from(uniqueResults.values()), results);
      });
    });

    const desktopInput = document.getElementById('search-input-desktop');
    const backdrop = document.getElementById('search-backdrop');

    if (desktopInput && backdrop) {
      // 1. Activate on Focus
      desktopInput.addEventListener('focus', () => {
        document.body.classList.add('search-focused');
      });

      // 2. Deactivate on Backdrop Click
      backdrop.addEventListener('click', () => {
        document.body.classList.remove('search-focused');
      });

      // 3. Deactivate on Escape Key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.body.classList.remove('search-focused');
          desktopInput.blur(); // Remove focus from input
          const results = document.getElementById('search-results-desktop');
          if (results) results.classList.remove('active');
        }
      });
    }

    function renderResults(items, container) {
      container.innerHTML = ''; // clear previous

      if (items.length === 0) {
        container.innerHTML = '<div style="padding:1rem; color:var(--fg-secondary);">No results found.</div>';
      } else {
        items.forEach(item => {
          const link = document.createElement('a');
          link.href = item.url;
          link.className = 'search-result-item';
          link.innerHTML = `
            <div class="search-item-section">${item.section || 'Doc'}</div>
            <span class="search-item-title">${item.title}</span>
          `;
          container.appendChild(link);
        });
      }
      container.classList.add('active');
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
      activeInputs.forEach(pair => {
        // If click is NOT inside input AND NOT inside results, close it
        if (!pair.input.contains(e.target) && !pair.results.contains(e.target)) {
          pair.results.classList.remove('active');
        }
      });
    });
  },

  /**
   * Sidebar Toggles
   * Handles the accordion logic for docs navigation
   */
  sidebarToggles: () => {
    const toggles = document.querySelectorAll('.sidebar-toggle-btn');
    toggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        btn.classList.toggle('open');
        const row = btn.closest('.sidebar-row');
        const container = row.nextElementSibling;

        if (container && container.classList.contains('sidebar-nested-group')) {
          container.classList.toggle('open');
        }
      });
    });
  },

  /**
   * Table of Contents & Smooth Scroll
   * Handles scroll-spy highlighting and smooth scroll offsetting
   */
  tocSpy: () => {
    const tocContainer = document.querySelector('#TableOfContents');
    if (!tocContainer) return;

    const headings = document.querySelectorAll('.prose h2, .prose h3, .prose h4');
    const tocLinks = tocContainer.querySelectorAll('a');
    
    if (headings.length === 0) return;

    // 1. Smooth Scroll with Offset
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const headerOffset = 80; // approx 4rem + padding
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
          history.pushState(null, null, '#' + targetId);
        }
      });
    });

    // 2. ScrollSpy
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          tocLinks.forEach(link => link.classList.remove('active'));
          const activeLink = tocContainer.querySelector(`a[href="#${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, { rootMargin: '-100px 0px -66% 0px' });

    headings.forEach(heading => observer.observe(heading));
  },

  /**
   * Announcement Banner
   * Handles dismissal using sessionStorage
   */
  banner: () => {
    const banner = document.getElementById('site-banner');
    const closeBtn = document.getElementById('banner-close-btn');

    if (!banner) return;

    const key = banner.getAttribute('data-key') || 'global';
    const storageKey = CONFIG.storage.bannerPrefix + key;

    if (sessionStorage.getItem(storageKey)) {
      banner.classList.add('banner-hidden');
      return;
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        banner.classList.add('banner-hidden');
        sessionStorage.setItem(storageKey, 'true');
      });
    }
  },

  /**
   * Email Newsletter Form
   * Handles submission and localStorage check to hide if subscribed
   */
  emailForm: () => {
    // 1. Check if already subscribed
    if (localStorage.getItem(CONFIG.storage.newsletter) === 'true') {
      const allCards = document.querySelectorAll('.email-capture-card');
      allCards.forEach(card => card.remove());
      return;
    }

    // 2. Bind Forms
    const forms = document.querySelectorAll('.js-email-capture-form');
    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const card = form.closest('.email-capture-card');
        const wrapper = card.querySelector('.js-email-form-wrapper');
        const successMsg = card.querySelector('.js-email-success-message');
        const btn = form.querySelector('button');
        
        const originalText = btn.innerText;
        btn.innerText = 'Sending...';
        btn.disabled = true;

        try {
          await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            mode: 'no-cors'
          });

          // Success
          localStorage.setItem(CONFIG.storage.newsletter, 'true');
          wrapper.classList.add('hidden');
          successMsg.classList.remove('hidden');

        } catch (err) {
          console.error('Submission error:', err);
          alert('Something went wrong. Please try again.');
          btn.innerText = originalText;
          btn.disabled = false;
        }
      });
    });
  }
};

// 4. Initialization
window.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme UI immediately
  window.App.updateThemeUI();
  
  // Initialize Modules
  Modules.mobileNav();
  Modules.search();
  Modules.sidebarToggles();
  Modules.tocSpy();
  Modules.banner();
  Modules.emailForm();
});

// 5. System Theme Listener
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (window.__theme === 'system') {
    if (e.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.App.updateThemeUI();
  }
});

// Allow global access to cycleTheme (for HTML onclick handlers)
window.cycleTheme = window.App.cycleTheme;
