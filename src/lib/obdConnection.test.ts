import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { WebBluetoothObd } from './obdConnection';

describe('WebBluetoothObd', () => {
  let obd: WebBluetoothObd;
  let originalNavigator: any;
  let requestDeviceMock: Mock;
  let getPrimaryServiceMock: Mock;
  let getCharacteristicsMock: Mock;
  let startNotificationsMock: Mock;
  let writeValueMock: Mock;
  let disconnectMock: Mock;
  let addEventListenerMock: Mock;
  let connectMock: Mock;

  beforeEach(() => {
    obd = new WebBluetoothObd();
    originalNavigator = global.navigator;

    // Reset mocks
    startNotificationsMock = vi.fn().mockResolvedValue(undefined);
    writeValueMock = vi.fn().mockResolvedValue(undefined);
    disconnectMock = vi.fn();
    addEventListenerMock = vi.fn();

    getCharacteristicsMock = vi.fn();
    getPrimaryServiceMock = vi.fn().mockResolvedValue({
      getCharacteristics: getCharacteristicsMock
    });

    connectMock = vi.fn().mockResolvedValue({
      getPrimaryService: getPrimaryServiceMock
    });

    requestDeviceMock = vi.fn().mockResolvedValue({
      addEventListener: addEventListenerMock,
      gatt: {
        connect: connectMock,
        disconnect: disconnectMock,
        connected: true,
      }
    });

    // Mock navigator.bluetooth
    Object.defineProperty(global, 'navigator', {
      value: {
        bluetooth: {
          requestDevice: requestDeviceMock
        }
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('throws error if Web Bluetooth API is not supported', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {}, // no bluetooth
      writable: true,
    });

    await expect(obd.connect()).rejects.toThrow(/Web Bluetooth API not supported/);
  });

  it('connects successfully with combined RX/TX characteristic', async () => {
    const rxTxCharMock = {
      uuid: '0000ffe1-0000-1000-8000-00805f9b34fb',
      properties: { notify: true },
      startNotifications: startNotificationsMock,
      addEventListener: vi.fn(),
      writeValue: writeValueMock,
    };
    getCharacteristicsMock.mockResolvedValue([rxTxCharMock]);

    // Send AT commands via writeValueMock
    // we want the promises returned by writeValue to resolve immediately
    // but the `sendCommand` waits for a timeout or characteristicvaluechanged
    // let's mock it so that we don't have to wait for timeouts

    vi.useFakeTimers();

    const connectPromise = obd.connect();

    // We need to resolve the three sendCommand calls in connect()
    // It's going to call ATZ, ATE0, ATL0, and await them
    // So after writeValue is called, we can advance timers to trigger the timeout resolution

    // Wait for the first command to be sent (ATZ)
    await vi.advanceTimersByTimeAsync(0);
    // writeValue should have been called for ATZ
    expect(writeValueMock).toHaveBeenCalledTimes(1);

    // Advance time by 5000ms to resolve ATZ
    await vi.advanceTimersByTimeAsync(5000);

    // writeValue for ATE0
    expect(writeValueMock).toHaveBeenCalledTimes(2);
    // Advance time by 5000ms to resolve ATE0
    await vi.advanceTimersByTimeAsync(5000);

    // writeValue for ATL0
    expect(writeValueMock).toHaveBeenCalledTimes(3);
    // Advance time by 5000ms to resolve ATL0
    await vi.advanceTimersByTimeAsync(5000);

    await connectPromise;

    expect(requestDeviceMock).toHaveBeenCalled();
    expect(connectMock).toHaveBeenCalled();
    expect(getPrimaryServiceMock).toHaveBeenCalledWith('0000ffe0-0000-1000-8000-00805f9b34fb');
    expect(getCharacteristicsMock).toHaveBeenCalled();
    expect(startNotificationsMock).toHaveBeenCalled();
    expect(rxTxCharMock.addEventListener).toHaveBeenCalledWith('characteristicvaluechanged', expect.any(Function));

    expect(obd.isConnected()).toBe(true);

    const encoder = new TextEncoder();
    expect(writeValueMock).toHaveBeenNthCalledWith(1, encoder.encode('ATZ\r'));
    expect(writeValueMock).toHaveBeenNthCalledWith(2, encoder.encode('ATE0\r'));
    expect(writeValueMock).toHaveBeenNthCalledWith(3, encoder.encode('ATL0\r'));
  });

  it('connects successfully with separate RX and TX characteristics', async () => {
    const rxCharMock = {
      uuid: 'rx',
      properties: { notify: true },
      startNotifications: startNotificationsMock,
      addEventListener: vi.fn(),
    };
    const txCharMock = {
      uuid: 'tx',
      properties: { write: true },
      writeValue: writeValueMock,
    };
    getCharacteristicsMock.mockResolvedValue([txCharMock, rxCharMock]);

    vi.useFakeTimers();

    const connectPromise = obd.connect();

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);

    await connectPromise;

    expect(startNotificationsMock).toHaveBeenCalled();
    expect(rxCharMock.addEventListener).toHaveBeenCalledWith('characteristicvaluechanged', expect.any(Function));
    expect(obd.isConnected()).toBe(true);
  });

  it('disconnects manually', async () => {
    const rxTxCharMock = {
      uuid: '0000ffe1-0000-1000-8000-00805f9b34fb',
      properties: { notify: true },
      startNotifications: startNotificationsMock,
      addEventListener: vi.fn(),
      writeValue: writeValueMock,
    };
    getCharacteristicsMock.mockResolvedValue([rxTxCharMock]);

    vi.useFakeTimers();
    const connectPromise = obd.connect();

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await connectPromise;

    expect(obd.isConnected()).toBe(true);

    await obd.disconnect();
    expect(disconnectMock).toHaveBeenCalled();
    expect(obd.isConnected()).toBe(false);
  });

  it('sendCommand resolves when buffer contains >', async () => {
    let charValueChangedCallback: any = null;
    const rxTxCharMock = {
      uuid: '0000ffe1-0000-1000-8000-00805f9b34fb',
      properties: { notify: true },
      startNotifications: startNotificationsMock,
      addEventListener: (event: string, cb: any) => {
        if (event === 'characteristicvaluechanged') {
          charValueChangedCallback = cb;
        }
      },
      writeValue: writeValueMock,
    };
    getCharacteristicsMock.mockResolvedValue([rxTxCharMock]);

    vi.useFakeTimers();
    const connectPromise = obd.connect();

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await connectPromise;

    expect(charValueChangedCallback).toBeTruthy();

    const sendPromise = obd.sendCommand('010C');

    // Simulate characteristic value changed with standard data response including >
    const encoder = new TextEncoder();
    charValueChangedCallback({
      target: {
        value: encoder.encode('41 0C 1A F8 \r\r>')
      }
    });

    const response = await sendPromise;
    expect(response).toBe('41 0C 1A F8 \r\r>');
  });

  it('sendCommand times out after 5 seconds', async () => {
    const rxTxCharMock = {
      uuid: '0000ffe1-0000-1000-8000-00805f9b34fb',
      properties: { notify: true },
      startNotifications: startNotificationsMock,
      addEventListener: vi.fn(),
      writeValue: writeValueMock,
    };
    getCharacteristicsMock.mockResolvedValue([rxTxCharMock]);

    vi.useFakeTimers();
    const connectPromise = obd.connect();

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await connectPromise;

    const sendPromise = obd.sendCommand('010C');

    await vi.advanceTimersByTimeAsync(5000);

    const response = await sendPromise;
    expect(response).toBe('TIMEOUT');
  });

  it('handles disconnection event', async () => {
    let gattDisconnectedCb: any = null;
    requestDeviceMock.mockResolvedValue({
      addEventListener: (event: string, cb: any) => {
        if (event === 'gattserverdisconnected') {
          gattDisconnectedCb = cb;
        }
      },
      gatt: {
        connect: connectMock,
        disconnect: disconnectMock,
        connected: true,
      }
    });

    const rxTxCharMock = {
      uuid: '0000ffe1-0000-1000-8000-00805f9b34fb',
      properties: { notify: true },
      startNotifications: startNotificationsMock,
      addEventListener: vi.fn(),
      writeValue: writeValueMock,
    };
    getCharacteristicsMock.mockResolvedValue([rxTxCharMock]);

    vi.useFakeTimers();
    const connectPromise = obd.connect();

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await connectPromise;

    expect(obd.isConnected()).toBe(true);
    expect(gattDisconnectedCb).toBeTruthy();

    gattDisconnectedCb();

    expect(obd.isConnected()).toBe(false);
  });
});
