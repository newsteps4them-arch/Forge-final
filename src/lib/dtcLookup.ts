/**
 * OBD-II Diagnostic Trouble Code (DTC) Lookup Utility
 *
 * Provides type-safe definitions, descriptions, severity mapping,
 * and diagnostic troubleshooting steps for vehicle fault codes.
 */

import dtcData from "../data/dtcDatabase.json";

export interface DtcRecord {
  code: string;
  system: string;
  title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  symptoms: string[];
  possibleCauses: string[];
  diagnosticSteps: string;
}

const dtcDatabase = dtcData as Record<string, Omit<DtcRecord, "code">>;

/**
 * Resolves a DTC code string (e.g., "P0300", "P0171") into a structured record.
 */
export function lookupDtc(code: string): DtcRecord {
  const cleanCode = code.trim().toUpperCase();
  const found = dtcDatabase[cleanCode];

  if (found) {
    return {
      code: cleanCode,
      ...found,
    } as DtcRecord;
  }

  // Fallback for codes not in static database
  const firstChar = cleanCode.charAt(0);
  let systemName = "General Vehicle System";
  if (firstChar === "P") systemName = "Powertrain / Engine / Transmission";
  if (firstChar === "B") systemName = "Body / Climate / SRS Airbag";
  if (firstChar === "C") systemName = "Chassis / ABS / Suspension";
  if (firstChar === "U") systemName = "Network / CAN Bus Communication";

  return {
    code: cleanCode,
    system: systemName,
    title: `Diagnostic Trouble Code ${cleanCode}`,
    severity: "Medium",
    symptoms: ["Check Engine Light illuminated", "Potential performance anomaly"],
    possibleCauses: ["Sensor circuit out of specification", "Wiring harness condition", "Component wear"],
    diagnosticSteps: `1. Connect OBD-II scanner to view freeze frame data for ${cleanCode}.\n2. Clear DTC code and re-test vehicle under operating conditions.`,
  };
}

/**
 * Returns color classes for severity badges.
 */
export function getSeverityBadgeClass(severity: DtcRecord["severity"]): string {
  switch (severity) {
    case "Critical":
      return "bg-red-500/20 text-red-400 border-red-500/40";
    case "High":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "Medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    case "Low":
    default:
      return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  }
}
