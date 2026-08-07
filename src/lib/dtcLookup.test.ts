import { describe, it, expect } from 'vitest';
import { lookupDtc, getSeverityBadgeClass } from './dtcLookup';

describe('dtcLookup', () => {
  describe('lookupDtc', () => {
    it('should return the correct record for a known code', () => {
      const record = lookupDtc('P0171');
      expect(record.code).toBe('P0171');
      expect(record.system).toBe('Powertrain');
      expect(record.title).toBe('System Too Lean (Bank 1)');
      expect(record.severity).toBe('High');
    });

    it('should be case-insensitive and handle whitespace', () => {
      const record = lookupDtc(' p0171 ');
      expect(record.code).toBe('P0171');
      expect(record.system).toBe('Powertrain');
      expect(record.title).toBe('System Too Lean (Bank 1)');
      expect(record.severity).toBe('High');
    });

    it('should return a fallback record for an unknown Powertrain code (P)', () => {
      const record = lookupDtc('P9999');
      expect(record.code).toBe('P9999');
      expect(record.system).toBe('Powertrain / Engine / Transmission');
      expect(record.title).toBe('Diagnostic Trouble Code P9999');
      expect(record.severity).toBe('Medium');
    });

    it('should return a fallback record for an unknown Body code (B)', () => {
      const record = lookupDtc('B9999');
      expect(record.code).toBe('B9999');
      expect(record.system).toBe('Body / Climate / SRS Airbag');
      expect(record.title).toBe('Diagnostic Trouble Code B9999');
      expect(record.severity).toBe('Medium');
    });

    it('should return a fallback record for an unknown Chassis code (C)', () => {
      const record = lookupDtc('C9999');
      expect(record.code).toBe('C9999');
      expect(record.system).toBe('Chassis / ABS / Suspension');
      expect(record.title).toBe('Diagnostic Trouble Code C9999');
      expect(record.severity).toBe('Medium');
    });

    it('should return a fallback record for an unknown Network code (U)', () => {
      const record = lookupDtc('U9999');
      expect(record.code).toBe('U9999');
      expect(record.system).toBe('Network / CAN Bus Communication');
      expect(record.title).toBe('Diagnostic Trouble Code U9999');
      expect(record.severity).toBe('Medium');
    });

    it('should return a general fallback record for an completely unknown format code', () => {
      const record = lookupDtc('X1234');
      expect(record.code).toBe('X1234');
      expect(record.system).toBe('General Vehicle System');
      expect(record.title).toBe('Diagnostic Trouble Code X1234');
      expect(record.severity).toBe('Medium');
    });
  });

  describe('getSeverityBadgeClass', () => {
    it('should return the correct class for Critical severity', () => {
      expect(getSeverityBadgeClass('Critical')).toBe('bg-red-500/20 text-red-400 border-red-500/40');
    });

    it('should return the correct class for High severity', () => {
      expect(getSeverityBadgeClass('High')).toBe('bg-amber-500/20 text-amber-400 border-amber-500/40');
    });

    it('should return the correct class for Medium severity', () => {
      expect(getSeverityBadgeClass('Medium')).toBe('bg-yellow-500/20 text-yellow-400 border-yellow-500/40');
    });

    it('should return the correct class for Low severity', () => {
      expect(getSeverityBadgeClass('Low')).toBe('bg-blue-500/20 text-blue-400 border-blue-500/40');
    });
  });
});
