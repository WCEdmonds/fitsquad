import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fit.mysquad.app',
  appName: 'FitSquad',
  webDir: 'out',
  server: {
    url: 'https://your-live-app-url.com',
    cleartext: true
  }
};

export default config;
