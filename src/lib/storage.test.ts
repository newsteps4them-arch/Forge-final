import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storage } from './storage';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Mock Capacitor Core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

// Mock Capacitor Preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup generic mock for localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Silence console.warn for cleaner test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('getItem', () => {
    it('should use localStorage on web platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      window.localStorage.setItem('test_key', 'web_value');

      const result = await storage.getItem('test_key');

      expect(result).toBe('web_value');
      expect(Preferences.get).not.toHaveBeenCalled();
      expect(window.localStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should use Preferences on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Preferences.get).mockResolvedValue({ value: 'native_value' });

      const result = await storage.getItem('test_key');

      expect(result).toBe('native_value');
      expect(Preferences.get).toHaveBeenCalledWith({ key: 'test_key' });
      expect(window.localStorage.getItem).not.toHaveBeenCalled();
    });

    it('should fallback to localStorage if Preferences.get throws an error on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Preferences.get).mockRejectedValue(new Error('Preferences error'));
      window.localStorage.setItem('test_key', 'fallback_value');

      const result = await storage.getItem('test_key');

      expect(result).toBe('fallback_value');
      expect(Preferences.get).toHaveBeenCalledWith({ key: 'test_key' });
      expect(console.warn).toHaveBeenCalledWith("Storage getItem failed", expect.any(Error));
      expect(window.localStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return null if fallback localStorage throws an error', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Preferences.get).mockRejectedValue(new Error('Preferences error'));
      vi.mocked(window.localStorage.getItem).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await storage.getItem('test_key');

      expect(result).toBeNull();
      expect(window.localStorage.getItem).toHaveBeenCalledWith('test_key');
    });
  });

  describe('setItem', () => {
    it('should use localStorage on web platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

      await storage.setItem('test_key', 'web_value');

      expect(Preferences.set).not.toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalledWith('test_key', 'web_value');
    });

    it('should use Preferences on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      await storage.setItem('test_key', 'native_value');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'test_key', value: 'native_value' });
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should fallback to localStorage if Preferences.set throws an error', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Preferences.set).mockRejectedValue(new Error('Preferences error'));

      await storage.setItem('test_key', 'fallback_value');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'test_key', value: 'fallback_value' });
      expect(console.warn).toHaveBeenCalledWith("Storage setItem failed", expect.any(Error));
      expect(window.localStorage.setItem).toHaveBeenCalledWith('test_key', 'fallback_value');
    });
  });

  describe('removeItem', () => {
    it('should use localStorage on web platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

      await storage.removeItem('test_key');

      expect(Preferences.remove).not.toHaveBeenCalled();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should use Preferences on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      await storage.removeItem('test_key');

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'test_key' });
      expect(window.localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should fallback to localStorage if Preferences.remove throws an error', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Preferences.remove).mockRejectedValue(new Error('Preferences error'));

      await storage.removeItem('test_key');

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'test_key' });
      expect(console.warn).toHaveBeenCalledWith("Storage removeItem failed", expect.any(Error));
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('test_key');
    });
  });
});
