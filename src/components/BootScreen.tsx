import { useState, useEffect } from "react";

const BOOT_LOGS = [
  "bios: initializing geospatial matrix v4.9.22",
  "kernel: memory test [OK] 64TB allocated",
  "syslog: bypassing local firewalls...",
  "syslog: access granted",
  "net: establishing secure orbital uplink...",
  "net: uplink [ESTABLISHED] latency: 12ms",
  "geo: fetching raw cartographic tile sets...",
  "geo: unpacking MapLibre GL engine...",
  "ai: injecting multi-persona neural network...",
  "ai: weighting analyst logic matrix...",
  "ai: weighting human rights heuristic...",
  "ai: weighting strategic prediction models...",
  "gdelt: syncing live terrestrial event feeds...",
  "gdelt: > 142 anomalies detected",
  "sys: decrypting threat polygons...",
  "run: geowatch_dashboard.exe",
  "",
  "WELCOME TO GEOWATCH."
];

interface BootScreenProps {
  onComplete: () => void;
}

const BootScreen = ({ onComplete }: BootScreenProps) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    // Rapidly print the logs
    const printLog = () => {
      if (currentIndex < BOOT_LOGS.length) {
        setLogs((prev) => {
           // Safety check for React StrictMode ghost loops
           if (prev.includes(BOOT_LOGS[currentIndex])) return prev;
           return [...prev, BOOT_LOGS[currentIndex]];
        });
        currentIndex++;
        
        // Randomize the typing delay to make it look like a real machine booting
        const delay = Math.random() * 100 + 30; // 30ms to 130ms per line
        timeoutId = setTimeout(printLog, delay);
      } else {
        // Finished printing logs. Hold on the WELCOME screen for 800ms, then fade out.
        timeoutId = setTimeout(() => {
          setIsFading(true);
          timeoutId = setTimeout(onComplete, 800); // Wait for fade transition
        }, 800);
      }
    };

    timeoutId = setTimeout(printLog, 300);
    return () => clearTimeout(timeoutId);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-black text-primary font-mono flex flex-col justify-end p-8 overflow-hidden transition-opacity duration-700 ease-in-out ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="absolute top-8 right-8 text-xs text-muted-foreground opacity-50">
        GEOWATCH_OS v.2.0.4 <br/>
        TERMINAL ACCESS
      </div>

      <div className="space-y-1 w-full max-w-4xl opacity-90">
        {logs.map((log, index) => (
          <div key={index} className="flex gap-4 text-xs md:text-sm">
            <span className="text-muted-foreground shrink-0 w-24">
              [{new Date().toISOString().substring(11, 23)}]
            </span>
            <span className={log?.startsWith?.("WELCOME") ? "text-white font-bold tracking-widest text-lg mt-4" : ""}>
              {log}
            </span>
          </div>
        ))}
        {/* Blinking cursor */}
        <div className="flex gap-4 text-xs md:text-sm mt-1">
          <span className="text-muted-foreground shrink-0 w-24">
            [{new Date().toISOString().substring(11, 23)}]
          </span>
          <span className="animate-pulse w-3 h-4 bg-primary inline-block"></span>
        </div>
      </div>
    </div>
  );
};

export default BootScreen;
