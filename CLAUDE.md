# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains two Shopify 2.0 themes:
- **SIYOU11:30:25/** - Customized Wonder Theme for SIYOU Nails (siyounails.com), a press-on nails e-commerce store
- **Original-Wonder-Theme/** - Unmodified Wonder Theme v2.1.2 by Nethype for reference

The customized theme is based on **Wonder Theme v2.1.2** and powers a store at `jcehkp-du.myshopify.com` (siyounails.com).

## Development Commands

```bash
# Start local development server
shopify theme dev --store=jcehkp-du.myshopify.com

# Push theme to store
shopify theme push

# Pull latest theme from store
shopify theme pull

# Run theme linting
shopify theme check

# Auto-fix linting issues
shopify theme check --auto-correct
```

## Theme Architecture

### Directory Structure
```
SIYOU11:30:25/
├── layout/        # Base templates (theme.liquid, password.liquid)
├── sections/      # Modular sections with JSON schemas for theme customizer
├── snippets/      # Reusable Liquid partials
├── blocks/        # AI-generated custom blocks (ai_gen_block_*.liquid)
├── templates/     # JSON page templates composing sections
├── config/        # Theme settings (settings_schema.json)
├── assets/        # CSS, JS, images, fonts
└── locales/       # Translations (50+ languages)
```

### JavaScript Architecture

**Core Files:**
- `pubsub.js` - Pub/sub pattern for component communication (`subscribe()`, `publish()`)
- `global.js` - Shopify utility functions and custom elements
- `base.js` - Core UI Web Components (DrawerNavSection, etc.)
- `constants.js` - Global constants including `PUB_SUB_EVENTS`
- `variants.js` - Product variant selection logic

**Pub/Sub Events** (defined in `constants.js`):
- `cart-update` - Cart contents changed
- `cart-error` - Cart operation failed
- `variant-change` - Product variant selection changed
- `cart-drawer-open/close` - Cart drawer state
- `quick-buy-drawer-open/close` - Quick add modal state

**Key Web Components (extend HTMLElement with connectedCallback):**
- Cart: `cart-drawer.js`, `cart.js`, `quick-add.js`
- Product: `product-form.js`, `variants.js`, `color-swatch.js`, `pdp.js`
- Sliders: `slider.js`, `products-slider.js`, `modal-swiper.js`
- Search: `search-drawer.js`, `search-tab.js`, `facets.js`
- Media: `video-controls.js`, `video-reels.js`, `gallery.js`

### CSS Architecture

- `critical.css` - Above-fold styles (loaded synchronously)
- `main.css` - Main stylesheet (loaded async via preload)
- `custom.css` - Custom overrides
- `settings.css.liquid` - Dynamic CSS variables from theme settings
- Section-specific CSS loaded on demand (e.g., `section-image-banner.css`)

CSS uses custom properties for theming, defined per-section via inline styles.

### Section Schema Pattern

Sections define settings at the bottom of `.liquid` files:
```liquid
{% schema %}
{
  "name": "Section Name",
  "settings": [...],
  "blocks": [...],
  "presets": [...]
}
{% endschema %}
```

### Template JSON Structure

Templates reference sections by ID:
```json
{
  "sections": {
    "section_id": {
      "type": "section-type",
      "blocks": {...},
      "settings": {...}
    }
  },
  "order": ["section_id", ...]
}
```

## Key Patterns

### Section Color Customization
Sections override CSS variables inline based on settings:
```liquid
{% assign text_rgb = section.settings.text_color | color_to_rgb %}
{% if text_rgb != 'rgba(0, 0, 0, 0.0)' %}
  --color-body-text: {{ section.settings.text_color }};
{% endif %}
```

### Product Variations via Metafields
- `settings.product_varations_metafield` - Links to variant products
- `settings.product_varations_color_metafield` - Color values for swatches

### AI-Generated Blocks
The `blocks/` directory contains AI-generated custom blocks with naming convention `ai_gen_block_[hash].liquid`. These follow the same schema pattern as sections.

### Consent Mode Pattern
GTM Consent Mode v2 is configured at the top of `theme.liquid`:
```liquid
gtag('consent', 'default', { 'analytics_storage': 'denied', 'ad_storage': 'denied', ... });
{% if customer_privacy %}
  gtag('consent', 'update', { 'ad_storage': {% if customer_privacy.marketing_allowed %}'granted'{% else %}'denied'{% endif %}, ... });
{% endif %}
```
This pattern ensures privacy compliance by defaulting to denied and updating based on Shopify's customer privacy settings.

## Third-Party Integrations

- **Google Tag Manager** (GTM-T6TT66MQ) with Consent Mode v2 - defaults to denied, updates based on Shopify customer_privacy
- **Facebook Pixel** (1151744733531057) - handled by official Facebook & Instagram app
- **AVADA SEO Suite** - SEO optimization
- **Swiper** - Touch slider/carousel (CSS loaded in theme.liquid)
- **PhotoSwipe** - Image lightbox gallery
- **Omnisend** - Email marketing
- **ChatTy** - Live chat widget (lazy-loaded via `snippets/lazy-load-chat.liquid`)

## Performance Considerations

### Known Issues
- Critical CSS is large (117KB vs target <15KB)
- Swiper CSS loaded in 12 locations (10 sections + 2 layouts) - consolidate if adding carousels
- Icon font (icomoon) uses `font-display: block` - consider `swap` for better CLS

### Existing Optimizations
- Hero images use `loading="eager"` and `fetchpriority="high"` for above-fold
- JavaScript uses `defer` attribute
- Fonts use `font-display: swap`
- Chat widget lazy-loaded with 10-second delay
- Responsive images with srcset/sizes

### Key Files for Performance
- Hero image: `blocks/ai_gen_block_d70f4e6.liquid:300-314`
- Hero preload: `layout/theme.liquid:72-77`
- CSS loading: `layout/theme.liquid:178-195`
- Font loading: `layout/theme.liquid:225-318`

## Important Snippets

- `card.liquid` - Product card rendering with variants, badges, quick-add
- `icons.liquid` - SVG icon system
- `cart-drawer.liquid` - Ajax cart drawer
- `countdown-timer.liquid` - Countdown timer component
- `meta-tags.liquid` - SEO meta tag generation

## Analysis Documentation

The `SIYOU11:30:25/REVIEWS/` directory contains detailed analysis:
- `PERFORMANCE_ANALYSIS.md` - Full performance audit with metrics and recommendations
- `SITE_ANALYSIS_REPORT.md` - URL structure, SEO status, and site health
- `QUICK_WINS_CHECKLIST.md` - Prioritized optimization tasks
- `MOBILE_PERFORMANCE_OPTIMIZATION_GUIDE.md` - Mobile-specific optimizations
