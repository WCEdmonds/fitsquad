'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export function CapacitorInit() {
  useEffect(() => {
    // Only run on native platforms (iOS/Android)
    if (Capacitor.isNativePlatform()) {
      const initStatusBar = async () => {
        try {
          // Set status bar to overlay mode (content goes behind it)
          await StatusBar.setOverlaysWebView({ overlay: true });

          // Set status bar style to light (white text)
          // Change to Style.Dark if you want dark text
          await StatusBar.setStyle({ style: Style.Light });

          // Optional: Set background color (transparent)
          await StatusBar.setBackgroundColor({ color: '#00000000' });
        } catch (error) {
          console.error('Error initializing status bar:', error);
        }
      };

      initStatusBar();
    }
  }, []);

  return null;
}
