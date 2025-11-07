'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

export function CapacitorInit() {
  useEffect(() => {
    // Only run on native platforms (iOS/Android)
    if (Capacitor.isNativePlatform()) {
      const initCapacitor = async () => {
        try {
          // Configure Status Bar
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#00000000' });

          // Configure Keyboard behavior
          await Keyboard.setAccessoryBarVisible({ isVisible: false });
          await Keyboard.setScroll({ isDisabled: false });
          await Keyboard.setResizeMode({ mode: KeyboardResize.Native });

          // Hide splash screen after app is ready
          await SplashScreen.hide({ fadeOutDuration: 300 });

          // Prevent pull-to-refresh gesture (common in native apps)
          document.body.style.overscrollBehavior = 'none';

        } catch (error) {
          console.error('Error initializing Capacitor:', error);
        }
      };

      initCapacitor();
    }
  }, []);

  return null;
}
