import { renderHook, act } from '@testing-library/react';
import { useObdTelemetry } from '../useObdTelemetry';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the OBD classes completely
const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockSendCommand = vi.fn();
const mockIsConnected = vi.fn().mockReturnValue(true);

vi.mock('../../lib/obdConnection', () => {
  class MockObd {
    connect = mockConnect;
    disconnect = mockDisconnect;
    sendCommand = mockSendCommand;
    isConnected = mockIsConnected;
  }
  return {
    WebBluetoothObd: MockObd,
    WebSerialObd: MockObd,
    SimulatedObd: MockObd,
  };
});

describe('useObdTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockIsConnected.mockReturnValue(true); // Default to true after connection
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes correctly and reads from localStorage', () => {
    localStorage.setItem('forge_terminal_logs', JSON.stringify(['[2024-01-01 12:00:00] Old Log']));
    const { result } = renderHook(() => useObdTelemetry('Simulated'));

    expect(result.current.obdConnected).toBe(false);
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0]).toBe('[2024-01-01 12:00:00] Old Log');
  });

  it('connects successfully and adds initial log', async () => {
    mockSendCommand.mockResolvedValueOnce('ELM327 v2.1'); // mock response for "ATI"

    const { result } = renderHook(() => useObdTelemetry('Simulated'));

    await act(async () => {
      const success = await result.current.connect();
      expect(success).toBe(true);
    });

    expect(mockConnect).toHaveBeenCalled();
    expect(mockSendCommand).toHaveBeenCalledWith('ATI');
    expect(result.current.obdConnected).toBe(true);

    // Check logs updated with ATI response
    expect(result.current.logs.some(log => log.includes('[sys] RX: ELM327 v2.1'))).toBe(true);
  });

  it('disconnects if already connected when connect is called', async () => {
    const { result } = renderHook(() => useObdTelemetry('Simulated'));

    // Connect first
    await act(async () => {
      await result.current.connect();
    });

    // Try connecting again -> should disconnect
    await act(async () => {
      const success = await result.current.connect();
      expect(success).toBe(false);
    });

    expect(mockDisconnect).toHaveBeenCalled();
    expect(result.current.obdConnected).toBe(false);
  });

  it('sends commands and updates logs', async () => {
    const { result } = renderHook(() => useObdTelemetry('Simulated'));

    await act(async () => {
      await result.current.connect();
    });

    mockSendCommand.mockResolvedValueOnce('OK');

    await act(async () => {
      const res = await result.current.sendCommand('ATZ');
      expect(res).toBe('OK');
    });

    expect(mockSendCommand).toHaveBeenCalledWith('ATZ');
    expect(result.current.logs.some(log => log.includes('[sys] TX: ATZ'))).toBe(true);
    expect(result.current.logs.some(log => log.includes('[sys] RX: OK'))).toBe(true);
  });

  it('fails to send command if not connected', async () => {
    const { result } = renderHook(() => useObdTelemetry('Simulated'));

    await expect(result.current.sendCommand('ATZ')).rejects.toThrow('Not connected');
  });

  it('starts background polling and correctly parses RPM data', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useObdTelemetry('Simulated'));

    await act(async () => {
      await result.current.connect();
    });

    // We expect `sendCommand("010C")` to be called inside setInterval
    mockSendCommand.mockResolvedValue('41 0C 0F A0'); // Mock RPM response (0FA0 hex = 4000 decimal. 4000/4 = 1000 RPM)

    // Fast forward to trigger first interval (2000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockSendCommand).toHaveBeenCalledWith('010C');
    expect(result.current.telemetry).toHaveLength(1);
    expect(result.current.telemetry[0].RPM).toBe(1000); // (15*256 + 160) / 4 = 1000

    // Fast forward again
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.telemetry).toHaveLength(2);
  });

  it('pauses and resumes polling on visibility change', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useObdTelemetry('Simulated'));

    await act(async () => {
      await result.current.connect();
    });

    mockSendCommand.mockResolvedValue('41 0C 0F A0');
    mockSendCommand.mockClear();

    // App goes to background
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Fast forward, should NOT poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(mockSendCommand).not.toHaveBeenCalledWith('010C');

    // App comes back to foreground
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Fast forward, SHOULD poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockSendCommand).toHaveBeenCalledWith('010C');
  });
});
