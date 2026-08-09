import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimulatedObd } from './obdConnection';

describe('SimulatedObd', () => {
  let obd: SimulatedObd;

  beforeEach(() => {
    obd = new SimulatedObd();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initially be disconnected', () => {
    expect(obd.isConnected()).toBe(false);
  });

  it('connect() should change connection state to true', async () => {
    await obd.connect();
    expect(obd.isConnected()).toBe(true);
  });

  it('disconnect() should change connection state to false', async () => {
    await obd.connect();
    expect(obd.isConnected()).toBe(true);
    await obd.disconnect();
    expect(obd.isConnected()).toBe(false);
  });

  it('sendCommand() should throw error if not connected', async () => {
    await expect(obd.sendCommand('ATZ')).rejects.toThrow('Not connected');
  });

  describe('when connected', () => {
    beforeEach(async () => {
      await obd.connect();
    });

    it('sendCommand(ATZ) should return ELM327 initialization string', async () => {
      const response = await obd.sendCommand('ATZ');
      expect(response).toBe('ELM327 v2.1\r\r>');
    });

    it('sendCommand(ATI) should return interpreter identifier', async () => {
      const response = await obd.sendCommand('ATI');
      expect(response).toBe('OBDII to RS232 Interpreter\r\r>');
    });

    it('sendCommand() with generic AT command should return OK', async () => {
      const response = await obd.sendCommand('ATE0');
      expect(response).toBe('OK\r\r>');

      const response2 = await obd.sendCommand('ATL0');
      expect(response2).toBe('OK\r\r>');
    });

    it('sendCommand(0100) should return supported PIDs', async () => {
      const response = await obd.sendCommand('0100');
      expect(response).toBe('41 00 BE 3F A8 13 \r\r>');
    });

    it('sendCommand(010C) should return simulated RPM', async () => {
      // Mock Math.random to ensure deterministic behavior for RPM calculation
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      // 800 + 0.5 * 2000 = 1800 RPM.
      // 1800 / 256 = 7 (a), 1800 % 256 = 8 (b)
      // 7 in hex is 07, 8 in hex is 08

      const response = await obd.sendCommand('010C');
      expect(response).toBe('41 0C 07 08 \r\r>');
    });

    it('sendCommand(0105) should return simulated ECT', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      // 80 + 0.5 * 20 = 90
      // ECT = 90. tempC + 40 = 130
      // 130 in hex is 82

      const response = await obd.sendCommand('0105');
      expect(response).toBe('41 05 82 \r\r>');
    });

    it('sendCommand(03) should return simulated DTC', async () => {
      const response = await obd.sendCommand('03');
      expect(response).toBe('43 01 33 00 00 \r\r>');
    });

    it('sendCommand() with unhandled command should return NO DATA', async () => {
      const response = await obd.sendCommand('UNKNOWN_CMD');
      expect(response).toBe('NO DATA\r\r>');
    });

    it('sendCommand() should trim and uppercase commands', async () => {
      const response = await obd.sendCommand('  atz  ');
      expect(response).toBe('ELM327 v2.1\r\r>');
    });
  });
});
