import { Slider } from "@/components/ui/slider";
import { Activity, Clock } from "lucide-react";

export const TIME_MARKERS = ["15min", "1hour", "24hours", "7days", "30days"] as const;
export type Timespan = typeof TIME_MARKERS[number];

const MARKER_LABELS: Record<Timespan, string> = {
  "15min": "15m",
  "1hour": "1h",
  "24hours": "24h",
  "7days": "7d",
  "30days": "30d"
};

interface TimelineSliderProps {
  timespan: Timespan;
  isLive: boolean;
  onChange: (t: Timespan) => void;
  onLiveToggle: (live: boolean) => void;
}

export const TimelineSlider = ({ timespan, isLive, onChange, onLiveToggle }: TimelineSliderProps) => {
  const currentIndex = TIME_MARKERS.indexOf(timespan);

  const handleSliderChange = (vals: number[]) => {
    const newSpan = TIME_MARKERS[vals[0]];
    onChange(newSpan);
    if (newSpan !== "15min") {
      onLiveToggle(false);
    }
  };

  const engageLive = () => {
    onChange("15min");
    onLiveToggle(true);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 w-[90vw] max-w-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-4 font-sans">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/70" />
          <span className="text-sm font-semibold tracking-wide text-white/90">Chronology Depth</span>
        </div>
        
        <button
          onClick={engageLive}
          className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-wide transition-all border rounded-full ${isLive ? 'bg-primary/20 text-white border-primary shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'}`}
        >
          <Activity className={`w-3 h-3 ${isLive ? 'animate-pulse text-emerald-400' : ''}`} />
          Live Feed
        </button>
      </div>

      <div className="px-2 pt-2">
         <Slider 
           value={[currentIndex >= 0 ? currentIndex : 2]} 
           max={4} 
           step={1} 
           onValueChange={handleSliderChange}
           className="cursor-pointer"
         />
         <div className="flex justify-between w-full mt-3 px-1">
           {TIME_MARKERS.map((marker, i) => (
             <div 
               key={marker} 
               className={`text-xs font-semibold text-center cursor-pointer transition-colors ${timespan === marker ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/40 hover:text-white/80'}`}
               onClick={() => handleSliderChange([i])}
             >
               |<br/>
               <span className="mt-1 block">{MARKER_LABELS[marker]}</span>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};
