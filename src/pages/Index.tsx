import { useState } from "react";
import WorldMap from "@/components/WorldMap";
import RelationsMap from "@/components/RelationsMap";
import FilterBar from "@/components/FilterBar";
import CountryDrawer from "@/components/CountryDrawer";
import BootScreen from "@/components/BootScreen";
import { ChatWidget } from "@/components/ChatWidget";
import { LiveNewsTab } from "@/components/LiveNewsTab";
import { ArticleReaderModal } from "@/components/ArticleReaderModal";
import { PinFilter } from "@/components/PinFilter";
import { useMapChat } from "@/hooks/useMapChat";
import type { Category } from "@/data/countryData";
import type { Article } from "@/types";

type ViewMode = "globe" | "relations";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [activePinFilter, setActivePinFilter] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("globe");

  const [highlightedIsos, setHighlightedIsos] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  const { messages, loading, sendMessage } = useMapChat();

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {isBooting && <BootScreen onComplete={() => setIsBooting(false)} />}
      
      <div className={`w-full h-full transition-opacity duration-1000 ${isBooting ? 'opacity-0' : 'opacity-100'}`}>
        <FilterBar 
          active={activeCategory} 
          onChange={setActiveCategory} 
          onSearch={setSelectedCountry} 
        />

        {/* View mode toggle — top right */}
        <div className="fixed top-20 right-6 z-30 flex flex-col gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-xl pointer-events-auto shadow-xl">
          <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest px-2 mb-0.5">View</div>
          <button
            onClick={() => setViewMode("globe")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              viewMode === "globe"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Globe
          </button>
          <button
            onClick={() => setViewMode("relations")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              viewMode === "relations"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="16" cy="16" r="1.5" fill="currentColor" />
              <circle cx="16" cy="8" r="1.5" fill="currentColor" />
              <line x1="8" y1="8" x2="16" y2="16" />
              <line x1="8" y1="8" x2="16" y2="8" />
            </svg>
            Relations
          </button>
        </div>

        {/* Pin filter (only on globe) */}
        {viewMode === "globe" && (
          <PinFilter activeFilter={activePinFilter} onChange={setActivePinFilter} />
        )}

        {/* Background watermark */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
          <span
            className="text-white font-black uppercase whitespace-nowrap"
            style={{
              fontSize: '15vw',
              letterSpacing: '0.05em',
              opacity: 0.08,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            }}
          >
            GeoWatch
          </span>
        </div>

        {/* Map views */}
        {viewMode === "globe" ? (
          <WorldMap
            activeCategory={activeCategory}
            activePinFilter={activePinFilter}
            timespan="24hours"
            isLive={false}
            highlightedIsos={highlightedIsos}
            onCountryClick={setSelectedCountry}
          />
        ) : (
          <RelationsMap
            activeCategory={activeCategory}
            onCountryClick={setSelectedCountry}
          />
        )}
        
        <CountryDrawer
          activeCategory={activeCategory}
          iso={selectedCountry}
          onClose={() => setSelectedCountry(null)}
        />

        <LiveNewsTab />
      </div>
      
      <ChatWidget
        messages={messages}
        loading={loading}
        onSendMessage={(q) => sendMessage(q, setHighlightedIsos)}
      />
      
      <ArticleReaderModal 
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
};

export default Index;
