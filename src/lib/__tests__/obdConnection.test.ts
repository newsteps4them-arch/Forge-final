import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSerialObd } from '../obdConnection';

describe('WebSerialObd', () => {
  let originalNavigatorSerial: any;

  beforeEach(() => {
    // Save original navigator.serial if it exists
    originalNavigatorSerial = (navigator as any).serial;
  });

  afterEach(() => {
    // Restore original navigator.serial
    if (originalNavigatorSerial === undefined) {
      delete (navigator as any).serial;
    } else {
      (navigator as any).serial = originalNavigatorSerial;
    }
    vi.restoreAllMocks();
  });

  it('should throw an error when Web Serial API is not supported', async () => {
    delete (navigator as any).serial;
    const obd = new WebSerialObd();

    await expect(obd.connect()).rejects.toThrowError('Web Serial API not supported in this browser. Please use Chrome/Edge or enable flags.');
  });

  it('should throw an error if requestPort fails (e.g. user cancels)', async () => {
    const errorMsg = 'No port selected by the user.';
    (navigator as any).serial = {
      requestPort: vi.fn().mockRejectedValue(new Error(errorMsg))
    };

    const obd = new WebSerialObd();

    await expect(obd.connect()).rejects.toThrowError(errorMsg);
  });
});
