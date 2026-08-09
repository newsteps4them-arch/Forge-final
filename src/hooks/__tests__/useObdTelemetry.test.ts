import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useObdTelemetry } from '../useObdTelemetry';

describe('useObdTelemetry', () => {
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize logs with empty array when localStorage is empty', () => {
    getItemSpy.mockReturnValueOnce(null);
    const { result } = renderHook(() => useObdTelemetry('Simulated'));
    expect(result.current.logs).toEqual([]);
    expect(getItemSpy).toHaveBeenCalledWith('forge_terminal_logs');
  });

  it('should initialize logs with parsed JSON from localStorage', () => {
    const mockLogs = ['[2023-01-01 12:00:00] Log 1', '[2023-01-01 12:00:01] Log 2'];
    getItemSpy.mockReturnValueOnce(JSON.stringify(mockLogs));

    const { result } = renderHook(() => useObdTelemetry('Simulated'));
    expect(result.current.logs).toEqual(mockLogs);
    expect(getItemSpy).toHaveBeenCalledWith('forge_terminal_logs');
  });

  it('should catch JSON parse errors and return empty array when localStorage data is invalid', () => {
    // Mock getItem to return invalid JSON string
    getItemSpy.mockReturnValueOnce('invalid json data');

    const { result } = renderHook(() => useObdTelemetry('Simulated'));

    // The hook should swallow the syntax error and return an empty array
    expect(result.current.logs).toEqual([]);
    expect(getItemSpy).toHaveBeenCalledWith('forge_terminal_logs');
  });
});
