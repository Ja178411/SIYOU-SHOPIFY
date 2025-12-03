import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for SIYOU Upsell Funnel Mobile Testing
 * Tests the mobile-specific functionality of the upsell popup
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,

  use: {
    // Base URL for the Shopify store
    baseURL: 'https://jcehkp-du.myshopify.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Mobile Safari (iPhone 12)
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        // Simulate iOS Safari
        isMobile: true,
        hasTouch: true,
      },
    },

    // Mobile Safari (iPhone SE - small screen)
    {
      name: 'Mobile Safari SE',
      use: {
        ...devices['iPhone SE'],
        isMobile: true,
        hasTouch: true,
      },
    },

    // Mobile Chrome (Pixel 5)
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        isMobile: true,
        hasTouch: true,
      },
    },

    // Desktop for comparison
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
