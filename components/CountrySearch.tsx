import { useState } from "react";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { countryScores, getColor } from "@/data/countryData";
import { useGoldsteinScores } from "@/hooks/useGoldsteinScores";

export const CountrySearch = ({ onSelect }: { onSelect: (iso: string) => void }) => {
  const [open, setOpen] = useState(false);
  const { data: goldsteinScores } = useGoldsteinScores();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-sm">
          <Search className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 border border-white/10 bg-black/40 backdrop-blur-2xl rounded-2xl pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)] mt-2 font-sans" align="end">
        <Command className="bg-transparent rounded-2xl">
          <CommandInput placeholder="Search Global Intelligence..." className="text-white font-medium text-sm border-b border-white/10 h-12 px-4" />
          <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <CommandEmpty className="p-4 text-white/50 text-center font-medium">No entities found.</CommandEmpty>
            <CommandGroup>
                {Object.entries(countryScores).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([iso, data]) => {
                  const g = goldsteinScores?.[iso];
                  const label = g ? g.label : "Stable";
                  const color = g ? g.color : getColor(data.score);

                  return (
                    <CommandItem
                      key={iso}
                      value={data.name}
                      onSelect={() => {
                        onSelect(iso);
                        setOpen(false);
                      }}
                      className="cursor-pointer hover:bg-white/10 text-white font-medium py-3 px-4 data-[selected=true]:bg-primary/20 data-[selected=true]:text-white border-b border-white/5 last:border-0 rounded-none transition-colors"
                    >
                      <div className="flex justify-between items-center w-full">
                         <div className="flex items-center gap-2">
                           <span className="font-semibold">{data.name}</span>
                           <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full border bg-black/40" style={{ borderColor: `${color}40` }}>
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                             <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color }}>
                               {label}
                             </span>
                           </div>
                         </div>
                         <span className="text-[10px] text-white/50 bg-white/5 rounded-full px-2 py-0.5">{iso}</span>
                      </div>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
