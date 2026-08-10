import { useState, useEffect, useRef, useCallback } from "react";
import { ObdConnection, WebBluetoothObd, WebSerialObd } from "../lib/obdConnection";

type ObdMode = "Bluetooth" | "USB";

const parseBytes = (response: string) =>
  (response.match(/[0-9A-Fa-f]{2}/g) || []).map((byte) => parseInt(byte, 16));

const parsePidValue = (response: string, pid: number): number | null => {
  const bytes = parseBytes(response);
  const index = bytes.findIndex((byte, i) => byte === 0x41 && bytes[i + 1] === pid);
  if (index === -1) return null;
  const a = bytes[index + 2];
  const b = bytes[index + 3];
  if (a === undefined) return null;

  switch (pid) {
    case 0x0c:
      return b === undefined ? null : ((a * 256) + b) / 4;
    case 0x05:
      return (a * 9) / 5 - 40;
    case 0x0d:
      return a;
    case 0x04:
    case 0x11:
      return (a * 100) / 255;
    case 0x0b:
      return a * 0.145038;
    case 0x0f:
      return (a * 9) / 5 - 40;
    case 0x10:
      return b === undefined ? null : ((256 * a + b) / 100);
    case 0x0e:
      return a / 2 - 64;
    case 0x06:
    case 0x07:
      return (a * 100) / 128 - 100;
    default:
      return null;
  }
};

export function useObdTelemetry(mode: ObdMode) {
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
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("forge_terminal_logs", JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save terminal logs to localStorage:", e);
    }
  }, [logs]);

  const addLog = useCallback((log: string) => {
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    setLogs((prev) => [`[${now}] ${log}`, ...prev].slice(0, 150));
  }, []);

  const connect = useCallback(async () => {
    if (obdConnected && obdRef.current) {
      try {
        await obdRef.current.disconnect();
      } catch (e) {}
      obdRef.current = null;
      setObdConnected(false);
      return false;
    }

    try {
      if (mode === "Bluetooth") {
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

      return true;
    } catch (err: any) {
      obdRef.current = null;
      setObdConnected(false);
      throw err;
    }
  }, [mode, obdConnected, addLog]);

  const sendCommand = useCallback(async (cmd: string) => {
    if (!obdRef.current || !obdConnected) throw new Error("Not connected");
    addLog(`[sys] TX: ${cmd}`);
    const res = await obdRef.current.sendCommand(cmd);
    addLog(`[sys] RX: ${res}`);
    return res;
  }, [obdConnected, addLog]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      if (!obdRef.current || !obdRef.current.isConnected()) {
        clearInterval(pollingRef.current!);
        setObdConnected(false);
        return;
      }

      try {
        const pidRequests = [
          ["010C", "RPM", 0x0c],
          ["0105", "ECT", 0x05],
          ["010D", "VSS", 0x0d],
          ["0104", "Load", 0x04],
          ["010B", "MAP", 0x0b],
          ["010F", "IAT", 0x0f],
          ["0110", "MAF", 0x10],
          ["010E", "SPARK", 0x0e],
          ["0106", "STFT1", 0x06],
          ["0107", "LTFT1", 0x07],
          ["0111", "TP", 0x11],
        ] as const;

        const sample: Record<string, number | string> = {
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        };

        for (const [command, key, pid] of pidRequests) {
          const response = await obdRef.current.sendCommand(command);
          const value = parsePidValue(response, pid);
          if (value !== null) sample[key] = Math.round(value * 10) / 10;
        }

        if (Object.keys(sample).length > 1) {
          setTelemetry((prev) => {
            const updated = [...prev, sample];
            return updated.length > 30 ? updated.slice(updated.length - 30) : updated;
          });
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (obdConnected) {
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

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
