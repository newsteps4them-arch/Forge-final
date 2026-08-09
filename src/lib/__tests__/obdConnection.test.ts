
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSerialObd } from '../obdConnection';

describe('WebSerialObd', () => {
  let originalNavigator: any;

  beforeEach(() => {
    originalNavigator = global.navigator;

    const mockNavigator = {
      ...originalNavigator
    };

    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('throws an error if navigator.serial is not available', async () => {
    delete (global.navigator as any).serial;

    const obd = new WebSerialObd();
    await expect(obd.connect()).rejects.toThrow(/Web Serial API not supported/);
    expect(obd.isConnected()).toBe(false);
  });

  it('connects successfully and sets up streams', async () => {
    const mockPort = {
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      readable: { pipeTo: vi.fn().mockResolvedValue(undefined) },
      writable: {}
    };

    const mockWriter = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn()
    };

    let readResolver: ((val: any) => void) | null = null;
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
         return new Promise(resolve => {
            readResolver = resolve;
         });
      }),
      cancel: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn()
    };

    class MockTextEncoderStream {
      readable = { pipeTo: vi.fn().mockResolvedValue(undefined) };
      writable = { getWriter: () => mockWriter };
    }

    class MockTextDecoderStream {
      readable = { getReader: () => mockReader };
      writable = {};
    }

    global.TextEncoderStream = MockTextEncoderStream as any;
    global.TextDecoderStream = MockTextDecoderStream as any;

    (global.navigator as any).serial = {
      requestPort: vi.fn().mockResolvedValue(mockPort)
    };

    const obd = new WebSerialObd();

    const connectPromise = obd.connect();

    // ATZ sendCommand resolution
    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATZ OK\r>', done: false });

    // ATE0 sendCommand resolution
    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATE0 OK\r>', done: false });

    await connectPromise;

    expect((global.navigator as any).serial.requestPort).toHaveBeenCalled();
    expect(mockPort.open).toHaveBeenCalledWith({ baudRate: 38400 });
    expect(obd.isConnected()).toBe(true);
    expect(mockWriter.write).toHaveBeenCalledWith('ATZ\r');
    expect(mockWriter.write).toHaveBeenCalledWith('ATE0\r');
  });

  it('disconnects and cleans up streams', async () => {
    const mockPort = {
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      readable: { pipeTo: vi.fn().mockResolvedValue(undefined) },
      writable: {}
    };

    const mockWriter = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn()
    };

    let readResolver: ((val: any) => void) | null = null;
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
         return new Promise(resolve => {
            readResolver = resolve;
         });
      }),
      cancel: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn()
    };

    class MockTextEncoderStream {
      readable = { pipeTo: vi.fn().mockResolvedValue(undefined) };
      writable = { getWriter: () => mockWriter };
    }

    class MockTextDecoderStream {
      readable = { getReader: () => mockReader };
      writable = {};
    }

    global.TextEncoderStream = MockTextEncoderStream as any;
    global.TextDecoderStream = MockTextDecoderStream as any;

    (global.navigator as any).serial = {
      requestPort: vi.fn().mockResolvedValue(mockPort)
    };

    const obd = new WebSerialObd();

    const connectPromise = obd.connect();

    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATZ OK\r>', done: false });

    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATE0 OK\r>', done: false });

    await connectPromise;
    expect(obd.isConnected()).toBe(true);

    await obd.disconnect();

    expect(obd.isConnected()).toBe(false);
    expect(mockReader.cancel).toHaveBeenCalled();
    expect(mockWriter.close).toHaveBeenCalled();
    expect(mockPort.close).toHaveBeenCalled();
  });

  it('sendCommand times out if no response is received', async () => {
    const mockPort = {
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      readable: { pipeTo: vi.fn().mockResolvedValue(undefined) },
      writable: {}
    };

    const mockWriter = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn()
    };

    let readResolver: ((val: any) => void) | null = null;
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
         return new Promise(resolve => {
            readResolver = resolve;
         });
      }),
      cancel: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn()
    };

    class MockTextEncoderStream {
      readable = { pipeTo: vi.fn().mockResolvedValue(undefined) };
      writable = { getWriter: () => mockWriter };
    }

    class MockTextDecoderStream {
      readable = { getReader: () => mockReader };
      writable = {};
    }

    global.TextEncoderStream = MockTextEncoderStream as any;
    global.TextDecoderStream = MockTextDecoderStream as any;

    (global.navigator as any).serial = {
      requestPort: vi.fn().mockResolvedValue(mockPort)
    };

    const obd = new WebSerialObd();

    const connectPromise = obd.connect();

    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATZ OK\r>', done: false });

    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATE0 OK\r>', done: false });

    await connectPromise;

    vi.useFakeTimers();
    const sendPromise = obd.sendCommand('0100');
    await vi.advanceTimersByTimeAsync(5010);

    const res = await sendPromise;
    expect(res).toBe('TIMEOUT');
    vi.useRealTimers();
  });

  it('sendCommand resolves when prompt > is received', async () => {
    const mockPort = {
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      readable: { pipeTo: vi.fn().mockResolvedValue(undefined) },
      writable: {}
    };

    const mockWriter = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn()
    };

    let readResolver: ((val: any) => void) | null = null;
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
         return new Promise(resolve => {
            readResolver = resolve;
         });
      }),
      cancel: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn()
    };

    class MockTextEncoderStream {
      readable = { pipeTo: vi.fn().mockResolvedValue(undefined) };
      writable = { getWriter: () => mockWriter };
    }

    class MockTextDecoderStream {
      readable = { getReader: () => mockReader };
      writable = {};
    }

    global.TextEncoderStream = MockTextEncoderStream as any;
    global.TextDecoderStream = MockTextDecoderStream as any;

    (global.navigator as any).serial = {
      requestPort: vi.fn().mockResolvedValue(mockPort)
    };

    const obd = new WebSerialObd();

    const connectPromise = obd.connect();

    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATZ OK\r>', done: false });

    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATE0 OK\r>', done: false });

    await connectPromise;

    const commandPromise = obd.sendCommand('010C');

    await new Promise(r => setTimeout(r, 0));
    expect(mockWriter.write).toHaveBeenCalledWith('010C\r');

    readResolver!({ value: '41 0C 0', done: false });
    await new Promise(r => setTimeout(r, 0));

    readResolver!({ value: 'F FF \r>', done: false });

    const response = await commandPromise;
    expect(response).toBe('41 0C 0F FF \r>');
  });

  it('readLoop handles done: true by ending loop', async () => {
    const mockPort = {
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      readable: { pipeTo: vi.fn().mockResolvedValue(undefined) },
      writable: {}
    };

    const mockWriter = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined)
    };

    let readResolver: ((val: any) => void) | null = null;
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
         return new Promise(resolve => {
            readResolver = resolve;
         });
      }),
      cancel: vi.fn().mockResolvedValue(undefined)
    };

    class MockTextEncoderStream {
      readable = { pipeTo: vi.fn().mockResolvedValue(undefined) };
      writable = { getWriter: () => mockWriter };
    }

    class MockTextDecoderStream {
      readable = { getReader: () => mockReader };
      writable = {};
    }

    global.TextEncoderStream = MockTextEncoderStream as any;
    global.TextDecoderStream = MockTextDecoderStream as any;

    (global.navigator as any).serial = {
      requestPort: vi.fn().mockResolvedValue(mockPort)
    };

    const obd = new WebSerialObd();

    const connectPromise = obd.connect();

    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATZ OK\r>', done: false });

    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: 'ATE0 OK\r>', done: false });

    await connectPromise;
    expect(obd.isConnected()).toBe(true);

    await new Promise(r => setTimeout(r, 0));
    readResolver!({ value: undefined, done: true });
  });

  it('sendCommand throws if not connected', async () => {
    const obd = new WebSerialObd();
    await expect(obd.sendCommand('0100')).rejects.toThrow(/Not connected/);
  });
});
