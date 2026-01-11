/// <reference types="@capacitor/keyboard" />
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'fit.mysquad.app',
  appName: 'FitSquad',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,
      backgroundColor: '#111827', /* Dark navy matching app theme */
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: KeyboardResize.None, // Keep viewport fixed, keyboard overlays content
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: false, // Don't resize in fullscreen mode either
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