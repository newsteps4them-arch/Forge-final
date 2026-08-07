import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebBluetoothObd } from './obdConnection';

describe('WebBluetoothObd', () => {
  let obd: WebBluetoothObd;
  let mockDevice: any;
  let mockServer: any;
  let mockService: any;
  let mockCharacteristic: any;

  beforeEach(() => {
    obd = new WebBluetoothObd();

    mockCharacteristic = {
      uuid: '0000ffe1-0000-1000-8000-00805f9b34fb',
      properties: { notify: true, write: true },
      startNotifications: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      writeValue: vi.fn().mockResolvedValue(undefined),
    };

    mockService = {
      getCharacteristics: vi.fn().mockResolvedValue([mockCharacteristic]),
    };

    mockServer = {
      getPrimaryService: vi.fn().mockResolvedValue(mockService),
    };

    mockDevice = {
      gatt: {
        connect: vi.fn().mockResolvedValue(mockServer),
        disconnect: vi.fn(),
        connected: true,
      },
      addEventListener: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      bluetooth: {
        requestDevice: vi.fn().mockResolvedValue(mockDevice),
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws an error if navigator.bluetooth is not available', async () => {
    vi.stubGlobal('navigator', {});
    await expect(obd.connect()).rejects.toThrow('Web Bluetooth API not supported in this environment');
  });

  it('connects successfully and initializes ELM327', async () => {
    // We mock sendCommand because connect() calls it three times (ATZ, ATE0, ATL0)
    const sendCommandSpy = vi.spyOn(obd, 'sendCommand').mockResolvedValue('OK');

    await obd.connect();

    expect(navigator.bluetooth.requestDevice).toHaveBeenCalled();
    expect(mockDevice.gatt.connect).toHaveBeenCalled();
    expect(mockServer.getPrimaryService).toHaveBeenCalled();
    expect(mockService.getCharacteristics).toHaveBeenCalled();
    expect(mockCharacteristic.startNotifications).toHaveBeenCalled();
    expect(mockCharacteristic.addEventListener).toHaveBeenCalledWith('characteristicvaluechanged', expect.any(Function));

    expect(obd.isConnected()).toBe(true);

    expect(sendCommandSpy).toHaveBeenCalledWith('ATZ');
    expect(sendCommandSpy).toHaveBeenCalledWith('ATE0');
    expect(sendCommandSpy).toHaveBeenCalledWith('ATL0');
  });

  it('disconnects successfully', async () => {
    // First connect
    vi.spyOn(obd, 'sendCommand').mockResolvedValue('OK');
    await obd.connect();
    expect(obd.isConnected()).toBe(true);

    // Then disconnect
    await obd.disconnect();
    expect(mockDevice.gatt.disconnect).toHaveBeenCalled();
    expect(obd.isConnected()).toBe(false);
  });

  it('sends command and resolves when data ends with >', async () => {
    // Need to test sendCommand without spying on it, but we still want to skip init commands in connect()
    // or just let them send, but it will block since sendCommand waits for a response.
    // So we need to mock the response mechanism.

    // During connect(), sendCommand is called. We'll simulate receiving '>' for each command.
    let listener: any;
    mockCharacteristic.addEventListener.mockImplementation((event: string, cb: any) => {
      if (event === 'characteristicvaluechanged') {
        listener = cb;
      }
    });

    // When writeValue is called, we immediately trigger the listener after a short delay
    mockCharacteristic.writeValue.mockImplementation(async (data: Uint8Array) => {
      setTimeout(() => {
        if (listener) {
          const encoder = new TextEncoder();
          listener({ target: { value: encoder.encode('OK\r\n>') } });
        }
      }, 10);
    });

    await obd.connect();

    // Now send a custom command
    const response = await obd.sendCommand('010C');
    expect(response).toContain('OK');
    expect(mockCharacteristic.writeValue).toHaveBeenCalled();
  });

  it('throws an error if sending command when not connected', async () => {
    await expect(obd.sendCommand('010C')).rejects.toThrow('Not connected');
  });

  it('resolves with TIMEOUT if no > received within 5000ms', async () => {
    vi.useFakeTimers();

    let listener: any;
    mockCharacteristic.addEventListener.mockImplementation((event: string, cb: any) => {
      if (event === 'characteristicvaluechanged') {
        listener = cb;
      }
    });

    // writeValue does nothing, so it will timeout
    mockCharacteristic.writeValue.mockResolvedValue(undefined);

    // mock connect to skip initialization wait
    const sendCommandSpy = vi.spyOn(obd, 'sendCommand').mockResolvedValue('OK');
    await obd.connect();

    // restore sendCommand to original so we can test the timeout
    sendCommandSpy.mockRestore();

    const sendPromise = obd.sendCommand('010C');

    vi.advanceTimersByTime(5000);

    const response = await sendPromise;
    expect(response).toBe('TIMEOUT');

    vi.useRealTimers();
  });
});
