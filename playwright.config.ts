import { defineConfig, devices } from '@playwright/test'

// One end-to-end test over the recorded sample: the built app, on a phone
// sized screen, with the network to the Workers refused — so it proves the
// main path works with no AI, no account and no signal.
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
