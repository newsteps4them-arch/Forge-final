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

// Mock window.localStorage
const mockLocalStorage = (() => {
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
  value: mockLocalStorage,
});

describe('storage utility', () => {
  const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('Web Platform (localStorage)', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as any).mockReturnValue(false);
    });

    it('should set an item in localStorage', async () => {
      await storage.setItem('testKey', 'testValue');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
      expect(Preferences.set).not.toHaveBeenCalled();
    });

    it('should get an item from localStorage', async () => {
      mockLocalStorage.setItem('testKey', 'testValue');
      const value = await storage.getItem('testKey');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
      expect(value).toBe('testValue');
      expect(Preferences.get).not.toHaveBeenCalled();
    });

    it('should return null for missing item in localStorage', async () => {
      const value = await storage.getItem('missingKey');
      expect(value).toBeNull();
    });

    it('should remove an item from localStorage', async () => {
      await storage.removeItem('testKey');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
      expect(Preferences.remove).not.toHaveBeenCalled();
    });
  });

  describe('Native Platform (Capacitor Preferences)', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as any).mockReturnValue(true);
    });

    it('should set an item in Preferences', async () => {
      await storage.setItem('testKey', 'testValue');
      expect(Preferences.set).toHaveBeenCalledWith({ key: 'testKey', value: 'testValue' });
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should get an item from Preferences', async () => {
      (Preferences.get as any).mockResolvedValue({ value: 'testValue' });
      const value = await storage.getItem('testKey');
      expect(Preferences.get).toHaveBeenCalledWith({ key: 'testKey' });
      expect(value).toBe('testValue');
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('should remove an item from Preferences', async () => {
      await storage.removeItem('testKey');
      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'testKey' });
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Fallbacks', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as any).mockReturnValue(true);
    });

    it('should fallback to localStorage if Preferences.get fails', async () => {
      (Preferences.get as any).mockRejectedValue(new Error('Native error'));
      mockLocalStorage.setItem('testKey', 'fallbackValue');

      const value = await storage.getItem('testKey');

      expect(mockWarn).toHaveBeenCalledWith('Storage getItem failed', expect.any(Error));
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
      expect(value).toBe('fallbackValue');
    });

    it('should return null if both Preferences and localStorage get fail', async () => {
      (Preferences.get as any).mockRejectedValue(new Error('Native error'));
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Local error');
      });

      const value = await storage.getItem('testKey');

      expect(mockWarn).toHaveBeenCalledWith('Storage getItem failed', expect.any(Error));
      expect(value).toBeNull();
    });

    it('should fallback to localStorage if Preferences.set fails', async () => {
      (Preferences.set as any).mockRejectedValue(new Error('Native error'));

      await storage.setItem('testKey', 'fallbackValue');

      expect(mockWarn).toHaveBeenCalledWith('Storage setItem failed', expect.any(Error));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', 'fallbackValue');
    });

    it('should handle failure of both Preferences and localStorage set gracefully', async () => {
      (Preferences.set as any).mockRejectedValue(new Error('Native error'));
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Local error');
      });

      await expect(storage.setItem('testKey', 'testValue')).resolves.not.toThrow();
      expect(mockWarn).toHaveBeenCalledWith('Storage setItem failed', expect.any(Error));
    });

    it('should fallback to localStorage if Preferences.remove fails', async () => {
      (Preferences.remove as any).mockRejectedValue(new Error('Native error'));

      await storage.removeItem('testKey');

      expect(mockWarn).toHaveBeenCalledWith('Storage removeItem failed', expect.any(Error));
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('should handle failure of both Preferences and localStorage remove gracefully', async () => {
      (Preferences.remove as any).mockRejectedValue(new Error('Native error'));
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Local error');
      });

      await expect(storage.removeItem('testKey')).resolves.not.toThrow();
      expect(mockWarn).toHaveBeenCalledWith('Storage removeItem failed', expect.any(Error));
    });
  });
});
