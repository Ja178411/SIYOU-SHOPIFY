/**
 * SIYOU Upsell Funnel - JavaScript
 * Handles the post-add-to-cart upsell popup
 */

(function() {
  'use strict';

  // Wait for DOM and pubsub to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUpsellFunnel);
  } else {
    initUpsellFunnel();
  }

  function initUpsellFunnel() {
    // Check if upsell is enabled
    if (!window.SIYOU_UPSELL || !window.SIYOU_UPSELL.enabled) {
      return;
    }

    const popup = document.querySelector('[data-upsell-popup]');
    const overlay = document.querySelector('[data-upsell-overlay]');
    
    if (!popup || !overlay) {
      return;
    }

    const triggerTag = window.SIYOU_UPSELL.triggerTag || 'upsell-trigger';
    const closeButtons = document.querySelectorAll('[data-upsell-close]');
    const addButtons = document.querySelectorAll('[data-upsell-add]');
    
    // Track if popup was shown this session to avoid annoying users
    let popupShownThisSession = sessionStorage.getItem('siyou_upsell_shown') === 'true';
    
    // Subscribe to cart updates
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.cartUpdate, handleCartUpdate);
    }

    // Close button handlers
    closeButtons.forEach(btn => {
      btn.addEventListener('click', closePopup);
    });

    // Overlay click to close
    overlay.addEventListener('click', closePopup);

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('active')) {
        closePopup();
      }
    });

    // Add to cart buttons in popup
    addButtons.forEach(btn => {
      btn.addEventListener('click', handlePopupAddToCart);
    });

    /**
     * Handle cart update events
     */
    function handleCartUpdate(event) {
      // Only show popup on product-form adds (not cart quantity changes)
      if (event.source !== 'product-form') {
        return;
      }

      // Don't show again if already shown this session
      if (popupShownThisSession) {
        return;
      }

      // Check if the added product has the trigger tag
      checkIfTriggerProduct(event.productVariantId).then(isTrigger => {
        if (isTrigger) {
          // Small delay to let the cart drawer animation start
          setTimeout(() => {
            openPopup();
            popupShownThisSession = true;
            sessionStorage.setItem('siyou_upsell_shown', 'true');
          }, 800);
        }
      });
    }

    /**
     * Check if a variant belongs to a trigger product
     */
    async function checkIfTriggerProduct(variantId) {
      try {
        // Fetch cart to get product info
        const response = await fetch('/cart.js');
        const cart = await response.json();
        
        // Find the item that was just added
        const item = cart.items.find(item => item.variant_id == variantId);
        
        if (!item || !item.product_id) {
          return false;
        }

        // Fetch product to check tags
        const productResponse = await fetch(`/products/${item.handle}.js`);
        const product = await productResponse.json();
        
        if (!product.tags) {
          return false;
        }

        // Check if product has the trigger tag
        const tags = product.tags.map(tag => tag.toLowerCase());
        return tags.includes(triggerTag.toLowerCase());
      } catch (error) {
        console.error('Upsell: Error checking product tags', error);
        return false;
      }
    }

    /**
     * Open the popup
     */
    function openPopup() {
      popup.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus first add button for accessibility
      const firstAddBtn = popup.querySelector('[data-upsell-add]:not([disabled])');
      if (firstAddBtn) {
        setTimeout(() => firstAddBtn.focus(), 300);
      }
    }

    /**
     * Close the popup
     */
    function closePopup() {
      popup.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    /**
     * Handle add to cart from popup
     */
    async function handlePopupAddToCart(e) {
      const button = e.currentTarget;
      const variantId = button.dataset.variantId;
      const productTitle = button.dataset.productTitle;
      const productCard = button.closest('.upsell-popup__product');

      if (!variantId || button.disabled) {
        return;
      }

      // Show loading state
      button.classList.add('loading');
      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = 'Adding...';

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: variantId,
            quantity: 1
          })
        });

        if (!response.ok) {
          throw new Error('Failed to add to cart');
        }

        // Success state
        button.classList.remove('loading');
        button.textContent = 'Added! ✓';
        button.style.background = '#28a745';
        productCard.classList.add('added');

        // Publish cart update event
        if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'upsell-popup',
            productVariantId: variantId
          });
        }

        // Dispatch cart-drawer:refresh event to update the cart drawer HTML
        // This is necessary to re-render the progress bar with updated count
        document.dispatchEvent(new CustomEvent('cart-drawer:refresh', {
          bubbles: true,
          detail: { source: 'upsell-popup' }
        }));

        // Close popup after brief delay to show success
        setTimeout(() => {
          closePopup();

          // Reset button state for next time
          setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
            button.disabled = false;
            productCard.classList.remove('added');
          }, 500);
        }, 1200);

      } catch (error) {
        console.error('Upsell: Error adding to cart', error);
        button.classList.remove('loading');
        button.textContent = 'Error - Try Again';
        button.disabled = false;
        
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    }

    // Expose functions for external use if needed
    window.SIYOU_UPSELL.openPopup = openPopup;
    window.SIYOU_UPSELL.closePopup = closePopup;
    window.SIYOU_UPSELL.resetSession = function() {
      popupShownThisSession = false;
      sessionStorage.removeItem('siyou_upsell_shown');
    };
  }
})();

