/**
 * BILLWISE Mobile Haptics Engine
 * Provides subtle tactile feedback for native mobile app feel.
 * Gracefully no-ops in non-supporting browsers or desktop environments.
 */

export const haptics = {
  /** Light tick for tab bar switches, segment changes, stepper taps (~8ms) */
  selection: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // Safe fallback if permission is restricted
      }
    }
  },

  /** Medium tap for primary button clicks and card presses (~15ms) */
  impact: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Safe fallback
      }
    }
  },

  /** Double pleasant pulse for successful save, calculation, or reconciliation */
  success: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([12, 50, 12]);
      } catch {
        // Safe fallback
      }
    }
  },

  /** Attention alert for slab warnings or threshold cross */
  warning: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 60, 20]);
      } catch {
        // Safe fallback
      }
    }
  },
};
