import { categories, type Category } from "@/data/countryData";
import { cn } from "@/lib/utils";
import { CountrySearch } from "@/components/CountrySearch";

interface FilterBarProps {
  active: Category;
  onChange: (cat: Category) => void;
  onSearch: (iso: string) => void;
}

const FilterBar = ({ active, onChange, onSearch }: FilterBarProps) => (
  <header className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-2xl border-b border-white/10 justify-between pointer-events-none shadow-sm">
    <div className="flex items-center gap-3 pointer-events-auto">
      <h1 className="text-primary font-bold text-lg tracking-wider mr-4 uppercase">
        GEO<span className="text-foreground">WATCH</span>
      </h1>

      <div className="hidden lg:flex gap-2 overflow-x-auto border-l border-white/10 pl-4 items-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all border",
              active === cat
                ? "bg-primary/20 text-white border-primary shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
    
    <div className="pointer-events-auto">
      <CountrySearch onSelect={onSearch} />
    </div>
  </header>
);

export default FilterBar;
