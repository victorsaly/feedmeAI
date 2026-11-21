import type { CapacitorConfig } from '@capacitor/cli'

// The iPhone app is this same web app, built into dist/ and wrapped. One
// codebase: nothing in src/ is native-only except what src/lib/native.ts
// switches on.
const config: CapacitorConfig = {
  appId: 'com.victorsaly.feedmeai',
  appName: 'FeedMe AI',
  webDir: 'dist',
  backgroundColor: '#f2f6f9',
  server: {
    // dist/ holds the product site at its root and the app under /app/;
    // the iPhone app is the app, so it starts there
    appStartPath: '/app/index.html',
  },
  ios: {
    // the page draws under the status bar and home indicator and pads itself
    // with the safe-area insets, as it does when installed from a browser
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 400,
      backgroundColor: '#f2f6f9',
      showSpinner: false,
    },
  },
}

export default config
