import { defineConfig, devices } from "@playwright/test";

//end-to-end tests: real browser, real backend, real (test) database
//run with: MONGODB_URI=... MONGODB_DB=piximem_test npm run test:e2e
const CI = Boolean(process.env.CI);

//lets a machine with its own Chromium point Playwright at it
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.js",
  fullyParallel: false,
  workers: 1, //the tests share one seeded database, so they run in order
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30000,
  expect: { timeout: 7000 },

  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    colorScheme: "dark",
    launchOptions: { executablePath },
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } }, testIgnore: /mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile/ },
  ],

  webServer: [
    {
      command: "npm --prefix ../backend start",
      url: "http://localhost:3000/api/health",
      reuseExistingServer: !CI,
      timeout: 60000,
    },
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: "http://localhost:5173",
      reuseExistingServer: !CI,
      timeout: 60000,
    },
  ],
});
