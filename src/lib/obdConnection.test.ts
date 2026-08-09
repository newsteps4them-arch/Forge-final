import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebBluetoothObd, WebSerialObd, SimulatedObd } from './obdConnection';

describe('WebBluetoothObd', () => {
  beforeEach(() => {
    // Reset any navigator modifications
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
      configurable: true
    });
  });

  it('should throw error if bluetooth is not in navigator', async () => {
    const obd = new WebBluetoothObd();
    await expect(obd.connect()).rejects.toThrow("Web Bluetooth API not supported in this environment. Please use Chrome or a compatible browser. For Android apps, specific plugins are required.");
  });

  it('should propagate errors from requestDevice when user cancels', async () => {
    Object.defineProperty(global.navigator, 'bluetooth', {
      value: {
        requestDevice: vi.fn().mockRejectedValue(new Error('User cancelled the requestDevice() chooser.'))
      },
      writable: true,
      configurable: true
    });

    const obd = new WebBluetoothObd();
    await expect(obd.connect()).rejects.toThrow('User cancelled the requestDevice() chooser.');
  });
});
