import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Utility functions for providing haptic feedback on native devices
 * These will only work on iOS and Android, not in browser
 */

export const haptics = {
  /**
   * Light impact - for subtle interactions like selecting items
   */
  light: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  },

  /**
   * Medium impact - for standard button presses
   */
  medium: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  },

  /**
   * Heavy impact - for important actions
   */
  heavy: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  },

  /**
   * Success notification - for successful actions
   */
  success: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.notification({ type: 'SUCCESS' as any });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  },

  /**
   * Warning notification - for warning actions
   */
  warning: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.notification({ type: 'WARNING' as any });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  },

  /**
   * Error notification - for error actions
   */
  error: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.notification({ type: 'ERROR' as any });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  },

  /**
   * Selection change - for scrolling through values
   */
  selection: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.selectionChanged();
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  },
};
