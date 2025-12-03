# SIYOU Nails Website Performance Analysis

**Website:** https://siyounails.com
**Analysis Date:** November 30, 2025
**Theme:** Wonder Theme v2.1.2 by Nethype (Shopify 2.0)

> **Last Verified:** December 3, 2025
> **Verification Notes:**
> - ✅ Hero image fix (loading="eager", fetchpriority="high") confirmed implemented
> - ✅ Swiper CSS count updated: 12 files (10 sections + 2 layouts)
> - ✅ CSS architecture counts corrected: 73 stylesheet_tag in 39 files, 83 style blocks
> - ✅ Added INP (Interaction to Next Paint) metric info for 2025 compliance
> - ✅ Updated estimated improvements to reflect completed optimizations
> - ✅ Icon font now uses `font-display: swap`; remaining recommendations are about optional payload reduction rather than a blocking issue

---

## Executive Summary

The SIYOU Nails website demonstrates **strong desktop performance (94/100)** but suffers from **critical mobile performance issues (54/100)**. The most alarming finding is an **8.4x slower LCP on mobile** (12.6s vs 1.5s desktop), which significantly impacts user experience and SEO rankings.

### Key Metrics At-a-Glance

| Metric | Desktop | Mobile | Status | Target (2025) |
|--------|---------|--------|--------|---------------|
| **Overall Score** | 94/100 | 54/100 | Mobile Critical | 90+ |
| **LCP (Largest Contentful Paint)** | 1.5s | 12.6s | 8x slower on mobile | <2.5s |
| **FCP (First Contentful Paint)** | 0.4s | 6.4s | Mobile poor | <1.8s |
| **TBT (Total Blocking Time)** | 30ms | 210ms | Mobile needs work | <200ms |
| **CLS (Cumulative Layout Shift)** | 0 | 0 | Excellent | <0.1 |
| **Speed Index** | 1.1s | - | Excellent | <3.4s |
| **SEO Score** | 100/100 | 100/100 | Perfect | - |
| **Accessibility Score** | 96/100 | 96/100 | Good | - |
| **Best Practices** | 92/100 | 92/100 | Good | - |

> **Note on Core Web Vitals (2025):** As of March 2024, Google replaced **First Input Delay (FID)** with **Interaction to Next Paint (INP)** as the official responsiveness metric. INP measures the latency of ALL interactions throughout the page lifecycle, not just the first one. Target: <200ms for "Good" rating.

---

## Critical Issues

### 1. Duplicate Facebook Pixel (CRITICAL)

**Pixel ID:** 1151744733531057

**Problem:** The same Facebook Pixel is being loaded from multiple sources:
1. Google Tag Manager (GTM-T6TT66MQ)
2. Omnisend app integration
3. Potentially Shopify Customer Events

**Current Mitigation:** Runtime deduplication wrapper in `snippets/prevent-duplicate-pixels.liquid`

**Impact:**
- Double-counting conversions and events
- Wasted network requests
- GDPR/privacy compliance risk
- Inaccurate analytics data

**Recommended Fix:** Consolidate to a single source (preferably Shopify Customer Events) and remove from other integrations.

---

### 2. Mobile Performance Gap (CRITICAL)

**The Problem:**
- Desktop LCP: 1.5s (Good)
- Mobile LCP: 12.6s (Poor - 8.4x slower)

**Root Causes:**
1. Render-blocking CSS (1,950ms potential savings)
2. Hero image using `loading="lazy"` instead of `loading="eager"`
3. Heavy JavaScript execution on slower mobile CPUs
4. Images not optimized for mobile viewports

**Impact:**
- Significant mobile user abandonment
- Lower Google search rankings (mobile-first indexing)
- Poor Core Web Vitals affecting SEO

---

### 3. Swiper CSS Loaded Multiple Times (HIGH)

**Problem:** Swiper CSS (51KB) is loaded independently in 12 files (10 sections + 2 layouts):

**Layout Files:**
| File | Line | Notes |
|------|------|-------|
| `layout/theme.liquid` | 179, 181 | Conditional preload + load |
| `layout/password.liquid` | 29, 30 | Loads BOTH swiper.css + swiper-bundle.min.css |

**Section Files:**
| File | Line |
|------|------|
| `sections/slideshow.liquid` | 1 |
| `sections/brands.liquid` | 2 |
| `sections/benefits-video.liquid` | 1 |
| `sections/collection-list.liquid` | 1 |
| `sections/featured-collection.liquid` | 15 |
| `sections/features-banner.liquid` | 52 |
| `sections/image-with-scrolling-text.liquid` | 1 |
| `sections/product-recommendations.liquid` | 1 |
| `sections/marquee-images.liquid` | 2 |
| `sections/testimonial-video-reels.liquid` | 1 |
| `sections/video-reels.liquid` | 1 |

**Impact:** Since `theme.liquid` already loads Swiper globally, all 10 section-level loads are completely redundant. Up to 510KB+ of wasted bandwidth when multiple sections are on the same page.

**Recommended Fix:** Remove Swiper CSS from all section files since it's already loaded in `theme.liquid`.

---

### 4. Hero Image Configuration (RESOLVED)

**LCP Element:** `img.ai-bf-hero-bg-image` (Black Friday Hero section)

**Status:** ✅ **FIXED** - This issue has been resolved.

**Current Implementation** (`blocks/ai_gen_block_d70f4e6.liquid:300-314`):
```liquid
<img
  src="{{ block.settings.background_image | image_url: width: 2000 }}"
  loading="eager"           ✅ Correct
  fetchpriority="high"      ✅ Correct
  ...
>
```

**Additional Optimizations in Place:**
- Hero image preload in `layout/theme.liquid:72-77`
- Responsive srcset with 375w, 750w, 1100w, 1500w, 2000w breakpoints
- Image served as optimized WebP format

---

## Render-Blocking Resources

### CSS Files Blocking Initial Render

| Resource | Size | Blocking Time |
|----------|------|---------------|
| critical.css | 14.7 KB | 1,310ms |
| custom.css | 1.6 KB | 490ms |
| settings.css | 2.7 KB | 490ms |
| accelerated-checkout-backwards-compat.css | 2.8 KB | 490ms |
| Main document | 21.8 KB | 2,790ms |

**Total Potential Savings:** 1,950ms

### Recommended Fixes

1. **Inline truly critical CSS** and defer the rest
2. **Convert settings.css to async** using preload pattern:
   ```liquid
   <link rel="preload" href="{{ 'settings.css' | asset_url }}" as="style" onload="this.onload=null;this.rel='stylesheet'">
   <noscript><link rel="stylesheet" href="{{ 'settings.css' | asset_url }}"></noscript>
   ```
3. **Remove unused CSS** (39KB identified as unused in main.css and critical.css)

---

## Font Loading Analysis

### Critical Path Latency: 1,902ms

| Font | Load Time | Size |
|------|-----------|------|
| GT Standard Regular | 1,423ms | 63.65 KB |
| GT Standard Semibold | 1,902ms | 64.48 KB |
| Figtree | 594ms | 13.40 KB |

### Current Implementation (Good)

**Location:** `layout/theme.liquid:225-333`

- Font-display: swap configured (prevents FOUT blocking)
- Critical fonts preloaded (body, headings, navigation, buttons, price)
- Preconnect to fonts.shopifycdn.com configured

### Issues Found

**Icon Font (`icomoon`):**
- Now uses `font-display: swap` (issue resolved in `layout/theme.liquid`)
- Still includes outdated formats (EOT, SVG) kept for legacy browser support
- Location: `layout/theme.liquid:235-245`

**Optional Future Optimization:**
```css
@font-face {
  font-family: 'icomoon';
  src: url(...) format('woff2'),
       url(...) format('woff');
  font-display: swap;
}
```

---

## JavaScript Analysis

### Total Execution Time: 1,016ms

| File | Execution Time | Notes |
|------|----------------|-------|
| variants.js | 199ms | Product variant logic |
| WPM script (bae1676...) | 282ms | Third-party tracking |
| ChatTy widget | 57ms | Live chat |
| Swiper library | 35ms | Carousel functionality |
| Monorail/analytics | 40ms | Shopify analytics |

### Main Thread Work Breakdown

| Category | Time |
|----------|------|
| Script Evaluation | 936ms |
| Other | 532ms |
| Style & Layout | 439ms |
| Script Parsing & Compilation | 252ms |
| Parse HTML & CSS | 62ms |
| Rendering | 55ms |
| Garbage Collection | 25ms |

### Long Tasks Identified

1. **variants.js:** 353ms initial task
2. **WPM script:** 353ms at 8,701ms
3. **variants.js:** 199ms at 9,684ms
4. **WPM script:** 101ms at 8,701ms
5. **ChatTy widget:** 57ms at 11,084ms

### Unused JavaScript (47KB potential savings)

| File | Total Size | Unused |
|------|------------|--------|
| mp-size-chart-main.min.js (Mageplaza) | 41.4 KB | 26.2 KB |
| bae1676cfwd... (WPM) | 50.2 KB | 20.5 KB |

---

## Third-Party Script Impact

### Total Third-Party Transfer: 412 KB

| Service | Transfer Size | Main Thread Time | Purpose |
|---------|---------------|------------------|---------|
| Omnisend (omnisnippet1.com) | 76 KB | 79ms | Email marketing |
| ChatTy (meetchatty.com) | 80 KB | 60ms | Live chat widget |
| Mageplaza Size Chart | 43 KB | 55ms | Product size charts |
| Bugsnag | 12 KB | 9ms | Error tracking |
| Avada | 28 KB | - | FAQ/chat integration |
| Shopify assets | 247 KB | 57ms | Core platform |

### Missing Preconnects (Potential 980ms LCP savings)

Add these to `layout/theme.liquid`:

```liquid
<link rel="preconnect" href="https://wt.omnisendlink.com" crossorigin>
<link rel="preconnect" href="https://cdn-fe.meetchatty.com" crossorigin>
<link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
```

---

## Image Optimization Opportunities

### Oversized Images (163-228 KB potential savings)

| Image | Current Size | Potential Savings | Display Size |
|-------|--------------|-------------------|--------------|
| OCEAN OF STARS product | 68.7 KB | 61.1 KB | 750x750 → 249x249 |
| Hero background | 121.8 KB | 27.6 KB | 1800x1160 → 1335x1210 |
| SWEET SNOWFLAKE | 36.2 KB | 32.2 KB | Oversized |
| WINTER STARS GLOW | 28.1 KB | 25.0 KB | Oversized |
| EMERALD GRACE | 25.8 KB | 23.0 KB | Oversized |
| LOVE SPARKLE | 24.7 KB | 21.9 KB | Oversized |

### Current Implementation (Good)

**Location:** `snippets/card.liquid:89-104`

```liquid
srcset="
  {% if img.width >= 375 %}{{ img | image_url: width: 375 }} 375w, {% endif %}
  {% if img.width >= 750 %}{{ img | image_url: width: 750 }} 750w, {% endif %}
  {% if img.width >= 1000 %}{{ img | image_url: width: 1000 }} 1000w, {% endif %}
  {% if img.width >= 1440 %}{{ img | image_url: width: 1440 }} 1440w, {% endif %}
  {{ img | image_url: width: 1000 }} 1000w
"
sizes="(min-width: 1000px) 620px, 100vw"
```

### Recommendation

Review the `sizes` attribute to ensure images aren't loaded at larger sizes than displayed, especially for product cards.

---

## CSS Architecture Issues

### Section-Level CSS Loading

**Problem:** 73 instances of `stylesheet_tag` across 39 section files, causing multiple render-blocking requests.

**Total Breakdown:**
- Sections: 73 instances across 39 files
- Layout: 12 instances (theme.liquid + password.liquid)
- Snippets: 7 instances across 6 files
- Templates: 8 instances

**High-Impact Sections:**
| Section | stylesheet_tag calls |
|---------|---------------------|
| main-product.liquid | 6 |
| featured-product.liquid | 6 |
| video-reels.liquid | 4 |
| testimonial-video-reels.liquid | 4 |
| benefits-video.liquid | 4 |

### Inline Style Blocks

**Problem:** 83 instances of `<style>` blocks across sections (76 in sections, 7 in snippets/layout)

| Section | Style Blocks |
|---------|--------------|
| ss-counter.liquid | 7 |
| main-product.liquid | 2 |
| featured-product.liquid | 2 |
| Most other sections | 1 each |

**Impact:**
- Increases critical rendering path
- CSS variables not reusable across sections
- Potential style conflicts

---

## Cache Policy Issues

### Resources with Short Cache TTL

| Resource | Current TTL | Recommended |
|----------|-------------|-------------|
| accelerated-checkout-backwards-compat.css | 5 minutes | 1 year |
| Third-party resources (omnisnippet1.com, avada.io, shop.app) | Short | Varies |

**Potential Savings:** 108 KB with proper cache headers

---

## Security Concerns

### Critical Security Headers Missing

| Issue | Severity | Impact |
|-------|----------|--------|
| Missing `script-src` directive in CSP | HIGH | XSS vulnerability |
| Missing `object-src` in CSP | HIGH | Plugin-based attacks |
| HSTS `max-age` too low | HIGH | Downgrade attacks |
| No `includeSubDomains` in HSTS | MEDIUM | Subdomain security |
| No COOP header | HIGH | Cross-origin isolation |
| Missing Trusted Types CSP | HIGH | DOM XSS protection |

### Console Errors Detected

- `monorail-edge.shopifysvc.com/v1/produce` - 400 Bad Request
- `shop.app/pay/hop` - 403 Forbidden

---

## Accessibility Issues

| Issue | Element | Severity |
|-------|---------|----------|
| Insufficient contrast | "SHOP NAILS" button | Medium |
| Insufficient contrast | "SHOP ACCESSORIES" button | Medium |
| Insufficient contrast | "SUBSCRIBE" button | Medium |
| Insufficient contrast | "CONTINUE SHOPPING" button | Medium |
| Heading hierarchy | H4 without H1-H3 | Low |

---

## Existing Optimizations (Working Well)

### Good Patterns in Place

1. **JavaScript Defer:** All main JS files use `defer` attribute
   - Location: `layout/theme.liquid:191-206`

2. **Async CSS Loading:** main.css uses preload + onload pattern
   - Location: `layout/theme.liquid:193-194`

3. **Font Display Swap:** Web fonts use `font-display: swap`
   - Location: `layout/theme.liquid:225-233`

4. **Responsive Images:** Proper srcset/sizes implementation
   - Location: `snippets/card.liquid`

5. **Chat Widget Lazy Loading:** 10-second delay + interaction trigger
   - Location: `snippets/lazy-load-chat.liquid`

6. **Hero Image Preload:** LCP image preloaded on homepage
   - Location: `layout/theme.liquid:75-81`

7. **GTM Optimization:** Preconnect + DNS prefetch configured
   - Location: `layout/theme.liquid:14-15`

8. **Web Components:** Custom elements with connectedCallback
   - Location: `assets/base.js`

9. **Pub/Sub Pattern:** Clean event communication
   - Location: `assets/pubsub.js`

10. **Debouncing:** Event handlers properly debounced
    - Location: `assets/cart.js`

---

## Recommendations Summary

### Priority 1: IMMEDIATE (This Week)

| Task | Impact | Effort | Status |
|------|--------|--------|--------|
| ~~Fix hero image loading attributes~~ | High | Low | ✅ DONE |
| Add missing preconnects | Medium | Low | Pending |
| Consolidate Facebook Pixel to single source | High | Medium | Pending |

### Priority 2: SHORT-TERM (This Month)

| Task | Impact | Effort |
|------|--------|--------|
| Consolidate Swiper CSS to single load | High | Medium |
| Convert settings.css to async loading | Medium | Low |
| Remove unused CSS (39KB) | Medium | Medium |
| Remove/lazy-load unused JavaScript (47KB) | Medium | Medium |

### Priority 3: MEDIUM-TERM (This Quarter)

| Task | Impact | Effort |
|------|--------|--------|
| Refactor section CSS loading strategy | High | High |
| Implement responsive image sizes audit | Medium | Medium |
| Optimize icon font (remove EOT/SVG, use swap) | Low | Low |
| Implement security headers (CSP, COOP, HSTS) | High | Medium |
| Fix accessibility contrast issues | Low | Low |

---

## File Reference

| Issue | File Location |
|-------|---------------|
| Duplicate Pixel Wrapper | `snippets/prevent-duplicate-pixels.liquid` |
| CSS Loading | `layout/theme.liquid:178-195` |
| JS Loading | `layout/theme.liquid:191-206` |
| Font Loading | `layout/theme.liquid:225-318` |
| Font Preloads | `layout/theme.liquid:304-318` |
| GTM Implementation | `layout/theme.liquid:13-52` |
| Hero Preload | `layout/theme.liquid:72-77` |
| Hero Image (Black Friday) | `blocks/ai_gen_block_d70f4e6.liquid:300-314` |
| Card Images | `snippets/card.liquid:89-104` |
| Chat Lazy Load | `snippets/lazy-load-chat.liquid` |
| Icon Font (icomoon) | `layout/theme.liquid:231-241` |
| Swiper CSS (global) | `layout/theme.liquid:179, 181` |

---

## Estimated Performance Improvements

If all remaining recommendations are implemented:

| Metric | Current (Mobile) | Estimated After | Notes |
|--------|------------------|-----------------|-------|
| Performance Score | 54/100 | 70-80/100 | Hero fix already applied |
| LCP | 12.6s | 5-7s | Depends on network conditions |
| FCP | 6.4s | 2.5-4s | CSS optimization needed |
| TBT | 210ms | 150ms | JS optimization needed |

**Completed Optimizations:**
- ✅ Hero image `loading="eager"` + `fetchpriority="high"`
- ✅ Hero image preload in document head

**Remaining Potential Savings:**
- Render-blocking CSS: ~1,500ms (reduced from 1,950ms due to hero fix)
- Unused CSS: 39KB
- Unused JS: 47KB
- Duplicate Swiper CSS: ~510KB (across 10 section files)
- Image optimization: 163-228KB

---

## Next Steps

1. Review this analysis with your development team
2. Create tickets for each priority category
3. Implement Priority 1 items immediately for quick wins
4. Schedule Priority 2 items for sprint planning
5. Add Priority 3 items to technical debt backlog
6. Re-run PageSpeed analysis after each batch of changes
7. Monitor Core Web Vitals in Google Search Console

---

*Analysis performed using PageSpeed Insights, codebase review, and third-party script auditing.*
