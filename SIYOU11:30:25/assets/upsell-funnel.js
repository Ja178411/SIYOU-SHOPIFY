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
      btn.addEventListener('click', (e) => {
        // If this is a link (View All), skip scroll restoration since we're navigating
        const isNavigationLink = btn.tagName === 'A' && btn.href;
        closePopup(isNavigationLink);
      });
    });

    // Overlay click to close
    overlay.addEventListener('click', () => closePopup());

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('active')) {
        closePopup();
      }
    });

    // Add to cart buttons in popup - SIMPLE APPROACH
    // Use pointerup instead of click for immediate mobile response
    addButtons.forEach((btn, index) => {
      let isProcessing = false;
      
      // #region agent log
      console.log('[UPSELL DEBUG] Setting up button', index, 'variantId:', btn.dataset.variantId);
      // #endregion
      
      // Use pointerup for immediate response on both touch and mouse
      btn.addEventListener('pointerup', async (e) => {
        // #region agent log
        console.log('[UPSELL DEBUG] pointerup on button', index, 'pointerType:', e.pointerType, 'isProcessing:', isProcessing);
        // #endregion
        
        // Prevent any other handlers
        e.preventDefault();
        e.stopPropagation();
        
        if (isProcessing || btn.disabled) {
          console.log('[UPSELL DEBUG] Skipping - already processing or disabled');
          return;
        }
        
        isProcessing = true;
        
        try {
          await handlePopupAddToCart({
            currentTarget: btn,
            type: e.type,
            stopPropagation: () => {},
            stopImmediatePropagation: () => {}
          });
        } finally {
          isProcessing = false;
        }
      });
      
      // Prevent click from firing (pointerup handles it)
      btn.addEventListener('click', (e) => {
        // #region agent log
        console.log('[UPSELL DEBUG] click blocked on button', index);
        // #endregion
        e.preventDefault();
        e.stopPropagation();
      }, true);
      
      // Prevent touchend from causing issues
      btn.addEventListener('touchend', (e) => {
        e.stopPropagation();
      }, { passive: true });
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

    // Store scroll position for iOS scroll lock
    let scrollPosition = 0;

    /**
     * Open the popup
     */
    function openPopup() {
      // Save scroll position before locking (for iOS)
      scrollPosition = window.scrollY || window.pageYOffset;

      popup.classList.add('active');
      overlay.classList.add('active');

      // Simple scroll lock - avoid position:fixed to prevent conflicts with cart drawer
      document.body.classList.add('upsell-popup-open');

      // Only use position:fixed trick if cart drawer is NOT open
      if (!document.body.classList.contains('page-overlay-cart-on')) {
        document.body.style.top = `-${scrollPosition}px`;
      }

      // Focus first add button for accessibility
      const firstAddBtn = popup.querySelector('[data-upsell-add]:not([disabled])');
      if (firstAddBtn) {
        setTimeout(() => firstAddBtn.focus(), 300);
      }
    }

    /**
     * Close the popup
     * @param {boolean} skipScrollRestore - Skip scroll restoration (for navigation clicks)
     */
    function closePopup(skipScrollRestore = false) {
      popup.classList.remove('active');
      overlay.classList.remove('active');

      // Check if we applied the position:fixed scroll lock
      const hadPositionLock = document.body.style.top !== '';

      // Remove scroll lock
      document.body.classList.remove('upsell-popup-open');
      document.body.style.top = '';

      // Only restore scroll if we had position lock and not skipping
      if (hadPositionLock && !skipScrollRestore) {
        window.scrollTo(0, scrollPosition);
      }
    }

    /**
     * Handle add to cart from popup
     */
    async function handlePopupAddToCart(e) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/98f7ec45-d329-4318-ac83-ac0b0bc5854e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upsell-funnel.js:191',message:'handlePopupAddToCart ENTRY',data:{type:e.type,timeStamp:e.timeStamp,buttonDisabled:e.currentTarget.disabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Stop event from propagating to parent elements (prevents swipe handlers)
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const button = e.currentTarget;
      const variantId = button.dataset.variantId;
      const productTitle = button.dataset.productTitle;
      const productCard = button.closest('.upsell-popup__product');

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/98f7ec45-d329-4318-ac83-ac0b0bc5854e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upsell-funnel.js:201',message:'Before validation check',data:{variantId:variantId||'MISSING',buttonDisabled:button.disabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (!variantId || button.disabled) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/98f7ec45-d329-4318-ac83-ac0b0bc5854e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upsell-funnel.js:202',message:'EARLY RETURN',data:{reason:!variantId?'no variantId':'button disabled'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return;
      }

      // Show loading state
      button.classList.add('loading');
      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = 'Adding...';

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/98f7ec45-d329-4318-ac83-ac0b0bc5854e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upsell-funnel.js:210',message:'Before fetch',data:{variantId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      try {
        const fetchStartTime = Date.now();
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

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/98f7ec45-d329-4318-ac83-ac0b0bc5854e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upsell-funnel.js:223',message:'After fetch',data:{ok:response.ok,status:response.status,fetchDuration:Date.now()-fetchStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        if (!response.ok) {
          throw new Error('Failed to add to cart');
        }

        // Success state
        button.classList.remove('loading');
        button.textContent = 'Added! ✓';
        button.style.background = '#28a745';
        productCard.classList.add('added');

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/98f7ec45-d329-4318-ac83-ac0b0bc5854e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upsell-funnel.js:235',message:'Success state set, before setTimeout',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        // Close popup first with short delay to show success, THEN update cart
        // This prevents race conditions with cart drawer's body class
        setTimeout(() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/98f7ec45-d329-4318-ac83-ac0b0bc5854e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upsell-funnel.js:236',message:'setTimeout callback fired',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          closePopup();

          // Reset button state for next time (in case popup reopens)
          button.textContent = originalText;
          button.style.background = '';
          button.disabled = false;
          productCard.classList.remove('added');

          // Now dispatch cart events AFTER popup is closed
          // This prevents the mobile opacity conflict
          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'upsell-popup',
              productVariantId: variantId
            });
          }

          // Dispatch cart-drawer:refresh event to update the cart drawer HTML
          document.dispatchEvent(new CustomEvent('cart-drawer:refresh', {
            bubbles: true,
            detail: { source: 'upsell-popup' }
          }));
        }, 600);

      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/98f7ec45-d329-4318-ac83-ac0b0bc5854e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upsell-funnel.js:260',message:'CATCH ERROR',data:{error:error.message,stack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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

