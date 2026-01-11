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
      // Add capacitor class to html element for CSS targeting
      document.documentElement.classList.add('capacitor');

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

          // Prevent pull-to-refresh gesture at body level
          document.body.style.overscrollBehavior = 'none';

          // Prevent scroll chaining to prevent body scroll
          document.body.style.overscrollBehaviorY = 'contain';

          // Hide the native splash screen after a short delay to allow app to render
          setTimeout(async () => {
            await SplashScreen.hide({ fadeOutDuration: 300 });
          }, 500);

        } catch (error) {
          console.error('Error initializing Capacitor:', error);
          // Still try to hide splash if there's an error
          try {
            await SplashScreen.hide();
          } catch {}
        }
      };

      initCapacitor();
    }
  }, []);

  return null;
}
