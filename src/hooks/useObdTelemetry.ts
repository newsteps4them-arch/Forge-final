/**
 * useObdTelemetry Hook
 *
 * Manages the connection and data streaming from an OBD-II interface.
 * Supports Bluetooth, USB (Serial), and Simulated modes.
 * Includes automatic polling of engine data (RPM, etc.) and handles
 * application lifecycle events (pausing on background).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { ObdConnection, WebBluetoothObd, WebSerialObd, SimulatedObd } from "../lib/obdConnection";

const OBD_RPM_FACTOR = 256;
const OBD_RPM_DIVISOR = 4;
const OBD_POLLING_MS = 2000;

export function useObdTelemetry(mode: "Bluetooth" | "USB" | "Simulated") {
  const [obdConnected, setObdConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("forge_terminal_logs");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const obdRef = useRef<ObdConnection | null>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  
  // Background polling interval reference
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync logs to localStorage for persistence across reloads
  useEffect(() => {
    try {
      localStorage.setItem("forge_terminal_logs", JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save terminal logs to localStorage:", e);
    }
  }, [logs]);

  /**
   * Adds a new entry to the diagnostic terminal log.
   */
  const addLog = useCallback((log: string) => {
    setLogs((prev) => [log, ...prev].slice(0, 50));
  }, []);

  /**
   * Initiates a connection to the OBD-II device based on the active mode.
   * If already connected, it will disconnect.
   */
  const connect = useCallback(async () => {
    if (obdConnected && obdRef.current) {
      try {
        await obdRef.current.disconnect();
      } catch (e) {}
      obdRef.current = null;
      setObdConnected(false);
      return false; // disconnected
    }

    try {
      if (mode === "Simulated") {
        obdRef.current = new SimulatedObd();
      } else if (mode === "Bluetooth") {
        obdRef.current = new WebBluetoothObd();
      } else if (mode === "USB") {
        obdRef.current = new WebSerialObd();
      } else {
        return false;
      }

      await obdRef.current.connect();
      setObdConnected(true);
      
      const res = await obdRef.current.sendCommand("ATI");
      addLog(`[sys] RX: ${res}`);
      
      return true; // connected
    } catch (err: unknown) {
      obdRef.current = null;
      setObdConnected(false);
      throw err;
    }
  }, [mode, obdConnected, addLog]);

  /**
   * Sends a raw OBD-II PID command and adds it to the logs.
   */
  const sendCommand = useCallback(async (cmd: string) => {
    if (!obdRef.current || !obdConnected) throw new Error("Not connected");
    const res = await obdRef.current.sendCommand(cmd);
    addLog(`[sys] TX: ${cmd}`);
    addLog(`[sys] RX: ${res}`);
    return res;
  }, [obdConnected, addLog]);

  /**
   * Starts a background polling service to fetch live telemetry data.
   */
  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    // Create an async interval
    pollingRef.current = setInterval(async () => {
       if (!obdRef.current || !obdRef.current.isConnected()) {
           clearInterval(pollingRef.current!);
           setObdConnected(false);
           return;
       }
       try {
           // Request RPM (01 0C)
           const res = await obdRef.current.sendCommand("010C");
           // Parse RPM manually based on ELM327 structure (for mock mostly)
           if (res.includes("41 0C") || res.includes("410C")) {
               const hexParts = res.split(" ");
               let A = 0; let B = 0;
               if (hexParts.length >= 4) {
                 A = parseInt(hexParts[2], 16);
                 B = parseInt(hexParts[3], 16);
               }
               const rpm = ((A * OBD_RPM_FACTOR) + B) / OBD_RPM_DIVISOR;
               
               setTelemetry(prev => {
                   const currTime = new Date().toLocaleTimeString('en-US', { hour12: false });
                   const updated = [...prev, { time: currTime, RPM: rpm, Boost: Math.random() * 20 }];
                   if (updated.length > 30) return updated.slice(updated.length - 30);
                   return updated;
               });
           }
       } catch (err) {
           console.error("Polling error", err);
       }
    }, OBD_POLLING_MS); // Poll every 2 seconds
  }, []);

  /**
   * Stops the background telemetry polling.
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Android Lifecycle equivalence: Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App goes to background -> Pause heavy operations / polling (onPause equivalent)
        stopPolling();
      } else {
        // App comes back -> Resume (onResume equivalent)
        if (obdConnected) {
          startPolling();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Automatically start polling when connected
    if (obdConnected) {
       startPolling();
    } else {
       stopPolling();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPolling();
    };
  }, [obdConnected, startPolling, stopPolling]);

  return {
    obdConnected,
    connect,
    sendCommand,
    logs,
    addLog,
    telemetry,
    setLogs,
  };
}
