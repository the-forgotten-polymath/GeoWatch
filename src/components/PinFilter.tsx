import { cn } from "@/lib/utils";

interface PinFilterProps {
  activeFilter: string | null;
  onChange: (filter: string | null) => void;
}

const pinTypes = [
  { label: "Conflict", color: "#ef4444" },
  { label: "Tension", color: "#f97316" },
  { label: "Stable", color: "#22c55e" },
  { label: "Coop", color: "#3b82f6" },
];

export const PinFilter = ({ activeFilter, onChange }: PinFilterProps) => {
  return (
    <div className="absolute top-20 left-6 z-30 flex flex-col gap-2 bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-xl pointer-events-auto shadow-xl">
      <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest px-2 mb-1">
        Tone Filter
      </div>
      {pinTypes.map((pin) => {
        const isActive = activeFilter === pin.color;
        return (
          <button
            key={pin.label}
            onClick={() => onChange(isActive ? null : pin.color)}
            className={cn(
              "flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all",
              isActive 
                ? "bg-white/10 text-white" 
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <div 
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                isActive ? "scale-125 shadow-lg" : ""
              )}
              style={{ 
                backgroundColor: pin.color,
                boxShadow: isActive ? `0 0 10px ${pin.color}` : `0 0 4px ${pin.color}88`
              }} 
            />
            {pin.label}
          </button>
        );
      })}
    </div>
  );
};
