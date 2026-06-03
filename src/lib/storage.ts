import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key });
        return value;
      }
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage getItem failed", e);
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("Storage setItem failed", e);
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn("Storage removeItem failed", e);
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  }
};
