/**
 * Tutorial Slideshow Component
 * Handles tutorial tab switching and maintains separate Swiper instances for each tutorial
 */

import Swiper from "./swiper-bundle.esm.browser.min.js";

class TutorialSlideshowSection extends HTMLElement {
  constructor() {
    super();
    this.tabs = this.querySelectorAll('.tutorial-tab');
    this.contents = this.querySelectorAll('.tutorial-content');
    this.swiperInstances = new Map();
    this.handleKeyboard = this.handleKeyboard.bind(this);
    this.handleTabKeyboard = this.handleTabKeyboard.bind(this);
  }

  connectedCallback() {
    this.init();
  }

  init() {
    // Add click and keyboard handlers to tutorial tabs
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', (e) => {
        this.switchTutorial(e.currentTarget);
      });

      // Arrow key navigation between tabs
      tab.addEventListener('keydown', (e) => this.handleTabKeyboard(e, index));
    });

    // Add keyboard listener for swiper navigation
    window.addEventListener('keydown', this.handleKeyboard);

    // Initialize swipers when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeSwipers());
    } else {
      this.initializeSwipers();
    }
  }

  /**
   * Handle keyboard navigation between tabs
   */
  handleTabKeyboard(event, currentIndex) {
    let newIndex;

    if (event.key === 'ArrowLeft') {
      newIndex = currentIndex - 1 < 0 ? this.tabs.length - 1 : currentIndex - 1;
    } else if (event.key === 'ArrowRight') {
      newIndex = currentIndex + 1 >= this.tabs.length ? 0 : currentIndex + 1;
    }

    if (newIndex !== undefined) {
      event.preventDefault();
      this.tabs[newIndex].click();
      this.tabs[newIndex].focus();
    }
  }

  /**
   * Handle keyboard navigation within swipers
   */
  handleKeyboard(event) {
    const focusedElement = document.activeElement;

    // Check if focus is within any of our swipers
    this.swiperInstances.forEach((swiper) => {
      if (swiper && swiper.el && swiper.el.contains(focusedElement)) {
        if (event.key === 'ArrowLeft') {
          swiper.slidePrev();
          event.preventDefault();
        } else if (event.key === 'ArrowRight') {
          swiper.slideNext();
          event.preventDefault();
        }
      }
    });
  }

  /**
   * Switch between tutorials
   */
  switchTutorial(clickedTab) {
    const tutorialId = clickedTab.dataset.tutorial;

    // Update tab active states and ARIA attributes
    this.tabs.forEach(tab => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    });
    clickedTab.classList.add('active');
    clickedTab.setAttribute('aria-selected', 'true');

    // Update content visibility
    this.contents.forEach(content => {
      const isTargetTutorial = content.dataset.tutorialContent === tutorialId;

      content.classList.toggle('active', isTargetTutorial);

      // Toggle hidden attribute for accessibility
      if (isTargetTutorial) {
        content.removeAttribute('hidden');
      } else {
        content.setAttribute('hidden', '');
      }

      if (isTargetTutorial) {
        // Reset the swiper to first slide when switching tutorials
        const swiper = this.swiperInstances.get(tutorialId);
        if (swiper) {
          swiper.slideTo(0, 0); // Jump to first slide without animation
          // Update swiper after switching from hidden to fix sizing issues
          requestAnimationFrame(() => {
            swiper.update();
          });
        }
      }
    });
  }

  /**
   * Initialize Swiper instances for each tutorial
   */
  initializeSwipers() {
    this.contents.forEach(content => {
      const tutorialId = content.dataset.tutorialContent;
      const swiperContainer = content.querySelector('[data-swiper]');
      const configScript = content.querySelector(`[data-swiper-configuration][data-tutorial="${tutorialId}"]`);

      if (swiperContainer && configScript) {
        try {
          const config = JSON.parse(configScript.textContent);

          // Add structural classes (like slider.js does)
          swiperContainer.classList.add('swiper');
          const wrapper = swiperContainer.querySelector('[data-swiper-container]');
          if (wrapper) {
            wrapper.classList.add('swiper-wrapper');
          }
          swiperContainer.querySelectorAll('[data-swiper-slide]').forEach(slide => {
            slide.classList.add('swiper-slide');
          });

          // Resolve navigation elements to actual DOM references (not strings)
          const nextEl = content.querySelector(`.tutorial-nav-next[data-tutorial="${tutorialId}"]`);
          const prevEl = content.querySelector(`.tutorial-nav-prev[data-tutorial="${tutorialId}"]`);
          const paginationEl = content.querySelector(`.tutorial-pagination[data-tutorial="${tutorialId}"]`);

          if (nextEl && prevEl) {
            config.navigation = {
              nextEl: nextEl,  // Element reference, not string selector
              prevEl: prevEl
            };
          }

          if (paginationEl) {
            config.pagination = {
              el: paginationEl,
              type: 'fraction',
              formatFractionCurrent: (number) => number,
              formatFractionTotal: (number) => number,
              renderFraction: (currentClass, totalClass) => {
                return `<span class="${currentClass}"></span> of <span class="${totalClass}"></span>`;
              }
            };
          }

          // Add RTL support
          if (document.documentElement.dir === 'rtl') {
            config.rtl = true;
          }

          // Add loading state removal on init
          config.on = config.on || {};
          const originalInit = config.on.init;
          config.on.init = function() {
            swiperContainer.classList.remove('loading');
            if (wrapper) {
              wrapper.classList.remove('loading');
            }
            if (originalInit) {
              originalInit.call(this);
            }
          };

          // Mark as loading before init
          swiperContainer.classList.add('loading');
          if (wrapper) {
            wrapper.classList.add('loading');
          }

          // Initialize Swiper
          const swiper = new Swiper(swiperContainer, config);
          this.swiperInstances.set(tutorialId, swiper);
        } catch (error) {
          console.error('Error initializing Swiper for tutorial:', tutorialId, error);
        }
      }
    });
  }

  disconnectedCallback() {
    // Remove keyboard listener
    window.removeEventListener('keydown', this.handleKeyboard);

    // Clean up swiper instances
    this.swiperInstances.forEach(swiper => {
      if (swiper && swiper.destroy) {
        swiper.destroy(true, true); // cleanup DOM and detach events
      }
    });
    this.swiperInstances.clear();
  }
}

customElements.define('tutorial-slideshow-section', TutorialSlideshowSection);
