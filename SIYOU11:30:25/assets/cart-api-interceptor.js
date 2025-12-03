/**
 * Cart API Interceptor
 * 
 * This script intercepts fetch requests to Shopify's cart API endpoints
 * to detect when third-party apps (like Essential Upsell) add products to the cart.
 * When detected, it dispatches a 'cart-drawer:refresh' event to update the cart drawer
 * without closing it.
 * 
 * Endpoints monitored:
 * - /cart/add.js
 * - /cart/update.js  
 * - /cart/change.js
 */
(function() {
  'use strict';

  // Store the original fetch function
  const originalFetch = window.fetch;

  // Cart API endpoints to monitor
  const CART_ENDPOINTS = ['/cart/add', '/cart/update', '/cart/change'];

  /**
   * Check if a URL is a cart API endpoint
   * @param {string} url - The URL to check
   * @returns {boolean}
   */
  function isCartApiEndpoint(url) {
    if (typeof url !== 'string') return false;
    return CART_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }

  /**
   * Dispatch cart drawer refresh event
   * @param {string} source - Source identifier for debugging
   */
  function refreshCartDrawer(source) {
    // Small delay to ensure Shopify has processed the cart update
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('cart-drawer:refresh', {
        bubbles: true,
        detail: { source: source || 'cart-api-interceptor' }
      }));
      
      // Also publish to pubsub if available (for other theme components)
      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-api-interceptor' });
      }
    }, 150);
  }

  // Override the global fetch function
  window.fetch = function(...args) {
    // Extract URL from arguments (could be string or Request object)
    let url = '';
    if (typeof args[0] === 'string') {
      url = args[0];
    } else if (args[0] instanceof Request) {
      url = args[0].url;
    } else if (args[0]?.url) {
      url = args[0].url;
    }

    const isCartEndpoint = isCartApiEndpoint(url);

    // Call the original fetch
    const fetchPromise = originalFetch.apply(this, args);

    // If this is a cart endpoint, handle the response
    if (isCartEndpoint) {
      fetchPromise.then(response => {
        // Only refresh if the request was successful
        if (response.ok) {
          // Clone the response so we can read it without affecting the original consumer
          response.clone().json().then(data => {
            // Check if this looks like a successful cart operation
            if (data && !data.status) { // Shopify errors have a 'status' field
              refreshCartDrawer('fetch-interceptor');
            }
          }).catch(() => {
            // JSON parsing failed, but response was OK - still refresh
            refreshCartDrawer('fetch-interceptor-fallback');
          });
        }
      }).catch(() => {
        // Fetch failed, do nothing
      });
    }

    return fetchPromise;
  };

  // Also intercept XMLHttpRequest for older implementations
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._cartApiUrl = url;
    this._isCartEndpoint = isCartApiEndpoint(url);
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    if (this._isCartEndpoint) {
      this.addEventListener('load', function() {
        if (this.status >= 200 && this.status < 300) {
          try {
            const data = JSON.parse(this.responseText);
            if (data && !data.status) {
              refreshCartDrawer('xhr-interceptor');
            }
          } catch (e) {
            // JSON parsing failed, still refresh as fallback
            refreshCartDrawer('xhr-interceptor-fallback');
          }
        }
      });
    }
    return originalXHRSend.apply(this, args);
  };

  // Log initialization for debugging
  if (window.console && window.console.log) {
    console.log('[Cart API Interceptor] Initialized - monitoring cart endpoints for third-party apps');
  }
})();

