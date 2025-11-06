import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fit.mysquad.app',
  appName: 'FitSquad',
  webDir: 'out',
  server: {
    url: 'mysquad.fit',
    cleartext: true
  }
};

export default config;
