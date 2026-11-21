import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Unit tests: the plain logic in src/lib, in a browser-like environment for
// localStorage and fetch. The end-to-end test lives in e2e/ and runs under
// Playwright instead (npm run test:e2e).
export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
  },
})
