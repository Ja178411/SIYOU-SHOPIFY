# Project Context: SIYOU Shopify Theme

## Overview

This workspace contains the Shopify theme development project for **SIYOU Nails** (siyounails.com). The core of the project is a customized Shopify 2.0 theme based on the **Wonder Theme v2.1.2**.

- **Primary Theme Directory:** `SIYOU11:30:25/`
- **Base Theme:** Wonder Theme v2.1.2 (by Nethype)
- **Live Store:** `jcehkp-du.myshopify.com`

## Key Technologies

- **Template Language:** [Liquid](https://shopify.dev/docs/api/liquid)
- **Styling:** CSS with custom properties (CSS Variables) for theming.
- **Scripting:** Vanilla JavaScript using ES6+ and Web Components (`HTMLElement`).
- **Testing:** Playwright (configured in `playwright.config.ts`).
- **Package Management:** NPM (primarily for dev tools like Playwright).

## Development Workflow

### Standard Commands

| Action | Command |
| :--- | :--- |
| **Start Dev Server** | `shopify theme dev --store=jcehkp-du.myshopify.com` |
| **Push to Store** | `shopify theme push` |
| **Pull from Store** | `shopify theme pull` |
| **Lint Code** | `shopify theme check` |
| **Auto-fix Lint** | `shopify theme check --auto-correct` |
| **Run Tests** | `npx playwright test` |

### Architecture & Structure

The project follows the standard Shopify 2.0 theme architecture:

- **`layout/`**: Master templates (e.g., `theme.liquid`, `password.liquid`).
- **`sections/`**: Dynamic, reusable UI components with Liquid schemas.
- **`snippets/`**: Reusable code chunks (partials).
- **`assets/`**: Static assets (JS, CSS, images, fonts).
- **`config/`**: Theme settings data and schema (`settings_schema.json`).
- **`locales/`**: Translation files.
- **`blocks/`**: Custom AI-generated blocks (naming: `ai_gen_block_[hash].liquid`).

### Key Implementations

#### JavaScript
- **Web Components:** Most interactive elements are custom elements (e.g., `cart-drawer`, `product-form`).
- **Pub/Sub:** A `pubsub.js` module handles component communication.
- **Events:** Standard events include `cart-update`, `variant-change`, `cart-drawer-open`.

#### CSS
- **`critical.css`**: Inlined for above-the-fold content.
- **`main.css`**: Async loaded for the rest of the site.
- **Dynamic Styling:** Uses `settings.css.liquid` to map theme settings to CSS variables.

#### Custom Features
- **Upsell Funnel:** A custom post-add-to-cart popup system.
    - Files: `snippets/upsell-popup.liquid`, `assets/upsell-funnel.js`.
    - Trigger: Controlled by product tags (default: `upsell-trigger`).
- **Custom Cart Events:** Uses `cart-drawer:refresh` to update the cart UI without page reloads.

## Testing

The project uses **Playwright** for end-to-end testing, specifically focusing on mobile responsiveness and the Upsell Funnel.

- **Config:** `playwright.config.ts`
- **Tests Directory:** `tests/`
- **Target Devices:** iPhone 12, iPhone SE, Pixel 5, Desktop Chrome.

## Documentation References

- **`CLAUDE.md`**: Contains deep architectural details, specific file references, and performance analysis summaries.
- **`SIYOU11:30:25/REVIEWS/`**: Contains detailed performance audits (`PERFORMANCE_ANALYSIS.md`) and site analysis reports.
