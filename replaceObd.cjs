const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add import
let finalImportStr = 'import { useNavigation, Screen } from "./hooks/useNavigation";\nimport { useObdTelemetry } from "./hooks/useObdTelemetry";';
content = content.replace('import { useNavigation, Screen } from "./hooks/useNavigation";', finalImportStr);

// 2. Replace state definitions
const stateDefRegex = /const \[obdConnected, setObdConnected\] = useState\(false\);\n  const obdRef = useRef<ObdConnection \| null>\(null\);\n  const \[diagnosticLogs, setDiagnosticLogs\] = useState<string\[\]>\(\[\]\);\n  const \[obdMode, setObdMode\] = useState<"Bluetooth" \| "USB" \| "Simulated">\(\n    "Simulated",\n  \);\n  const \[telemetry, setTelemetry\] = useState<any\[\]>\(\[\]\);/g;

content = content.replace(stateDefRegex, `const [obdMode, setObdMode] = useState<"Bluetooth" | "USB" | "Simulated">("Simulated");
  const { obdConnected, connect, sendCommand, logs: diagnosticLogs, addLog, telemetry } = useObdTelemetry(obdMode);`);

// 3. Remove useEffect that extracts telemetry manually
const extractTelemetryEffect = `  useEffect(() => {
    // Extract telemetry from logs
    const newestLog = diagnosticLogs[0];
    if (newestLog && newestLog.includes("RX:")) {
      const match = newestLog.match(/\\(([^:]+): ([\\d.]+)/);
      if (match) {
        const name = match[1];
        const val = parseFloat(match[2]);
        if (name === "RPM" || name === "Boost") {
          setTelemetry((prev) => {
            const time = new Date().toLocaleTimeString("en-US", {
              hour12: false,
            });
            const last = prev[prev.length - 1] || { time, RPM: 0, Boost: 0 };
            const newData = { ...last, time, [name]: val };
            const next = [...prev, newData];
            if (next.length > 20) return next.slice(next.length - 20);
            return next;
          });
        }
      }
    }
  }, [diagnosticLogs]);`;

if(content.includes(extractTelemetryEffect)) {
    content = content.replace(extractTelemetryEffect, '');
} else {
    // use a regex to delete it because spacing might differ
    content = content.replace(/useEffect\(\(\) => \{\n\s+\/\/ Extract telemetry from logs[\s\S]*?\}, \[diagnosticLogs\]\);/g, '');
}

// 4. Update handleConnect
const oldHandleConnect = /const handleConnect = async \(\) => \{[\s\S]*?toast\.show\(`Connected via \$\{obdMode\}`\, "success"\);\n    \} catch \(err: any\) \{\n      toast\.show\(`Connection failed: \$\{err\.message\}`\, "error"\);\n    \}\n  \};/;

content = content.replace(oldHandleConnect, `const handleConnect = async () => {
    try {
      const connected = await connect();
      if (connected) {
        toast.show(\`Connected via \${obdMode}\`, "success");
      } else {
        toast.show("Disconnected", "info");
      }
    } catch (err: any) {
      toast.show(\`Connection failed: \${err.message}\`, "error");
    }
  };`);

// 5. Update handleDiagnosticCommand
const oldHandleCommand = /const handleDiagnosticCommand = async \(command: string\) => \{[\s\S]*?if \(!obdConnected || !obdRef\.current\) \{[\s\S]*?setDiagnosticLogs\(\(prev\) =>\n         \[`\[sys\] ERROR: \$\{e\.message\}`\, \.\.\.prev\]\.slice\(0, 50\),\n       \);\n    \}\n  \};/;

content = content.replace(oldHandleCommand, `const handleDiagnosticCommand = async (command: string) => {
    if (!obdConnected) {
      addLog("[sys] Cannot send - Not connected");
      return;
    }
    
    try {
       const res = await sendCommand(command);
       // basic mock checking for DTCs (03)
       if (command === "03") {
         if (res.includes("43 01 33")) {
           setDetectedDtcs([
             { code: "P0133", sys: "O2 Sensor", stat: "Active" },
           ]);
           toast.show("Diagnostic trouble codes detected", "error");
         }
       }
       if (command === "04") {
         setDetectedDtcs([]);
         toast.show("DTC Memory Cleared", "success");
       }
    } catch (e: any) {
       addLog(\`[sys] ERROR: \${e.message}\`);
    }
  };`);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Replaced obd connection logic with background hook.");
