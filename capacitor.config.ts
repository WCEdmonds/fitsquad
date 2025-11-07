import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fit.mysquad.app',
  appName: 'FitSquad',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: false, // We'll hide it manually in CapacitorInit
      backgroundColor: '#F0F0F0',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#4B5320',
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#00000000',
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
  },
};

export default config;
