import { memo, useMemo, useState } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { countryScores, getColor, type Category } from "@/data/countryData";
import { countryCoordinates } from "@/data/countryCoordinates";
import { globalRelations } from "@/data/relationships";
import { useGdeltEvents } from "@/hooks/useGdeltEvents";
import { useGoldsteinScores } from "@/hooks/useGoldsteinScores";

interface WorldMapProps {
  activeCategory: Category;
  activePinFilter?: string | null;
  timespan: string;
  isLive: boolean;
  highlightedIsos?: string[];
  onCountryClick: (iso: string) => void;
}

/** Determine which ISOs are relevant for the current category filter. */
function getFilteredCountries(activeCategory: Category) {
  return Object.entries(countryScores)
    .filter(([, data]) => activeCategory === "All" || data.category === activeCategory)
    .map(([iso, data]) => ({ iso, ...data }));
}

/** Get unique ISOs from relationship edges that aren't already in countryScores. */
function getRelationshipOnlyIsos(): string[] {
  const scoreIsos = new Set(Object.keys(countryScores));
  const relIsos = new Set<string>();
  globalRelations.forEach(r => {
    if (!scoreIsos.has(r.source)) relIsos.add(r.source);
    if (!scoreIsos.has(r.target)) relIsos.add(r.target);
  });
  return [...relIsos];
}

const WorldMap = memo(({ activeCategory, activePinFilter, timespan, isLive, highlightedIsos, onCountryClick }: WorldMapProps) => {
  const [hoveredCountry, setHoveredCountry] = useState<{ iso: string; name: string; x: number; y: number } | null>(null);
  const [eventTooltip, setEventTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  
  const { data: eventsData } = useGdeltEvents(activeCategory, timespan, isLive);
  const { data: goldsteinScores } = useGoldsteinScores();

  // Country pins: all countries from countryScores
  const countryPins = useMemo(() => {
    let scored = getFilteredCountries(activeCategory);
    
    return scored
      .filter(c => countryCoordinates[c.iso])
      .map(c => {
        const goldstein = goldsteinScores?.[c.iso];
        const color = goldstein ? goldstein.color : getColor(c.score);
        return {
          iso: c.iso,
          name: c.name,
          category: c.category,
          coords: countryCoordinates[c.iso],
          color: color,
          goldsteinLabel: goldstein ? goldstein.label : 'Stable'
        };
      })
      .filter(pin => {
        if (!activePinFilter) return true;
        return pin.color === activePinFilter;
      });
  }, [activeCategory, goldsteinScores, activePinFilter]);

  // Extra relationship-only country pins (shown as dim markers)
  const relationshipPins = useMemo(() => {
    if (activeCategory !== "All" || activePinFilter) return [];
    return getRelationshipOnlyIsos()
      .filter(iso => countryCoordinates[iso])
      .map(iso => ({
        iso,
        name: iso,
        coords: countryCoordinates[iso],
      }));
  }, [activeCategory, activePinFilter]);

  const fillColorExpression = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expression: any = ['match', ['get', 'ISO3166-1-Alpha-3']];
    for (const [iso, data] of Object.entries(countryScores)) {
      if (activeCategory !== "All" && data.category !== activeCategory) {
        expression.push(iso, "hsl(220, 10%, 18%)");
      } else {
        const goldstein = goldsteinScores?.[iso];
        let color = "hsl(0, 0%, 15%)"; // Stable (Dark Grey)
        if (goldstein) {
          if (goldstein.avgTone < -5) color = "hsl(0, 0%, 98%)"; // Conflict (White)
          else if (goldstein.avgTone <= 0) color = "hsl(0, 0%, 45%)"; // Tension (Mid Grey)
        }
        expression.push(iso, color);
      }
    }
    expression.push("hsl(0, 0%, 8%)"); // unknown
    return expression;
  }, [goldsteinScores, activeCategory]);

  const linePaint = useMemo(() => {
    if (!highlightedIsos || highlightedIsos.length === 0) {
      return {
        "line-color": "rgba(255,255,255,0.05)",
        "line-width": 0.5
      };
    }
    const colorMatch: any[] = ["match", ["get", "ISO3166-1-Alpha-3"]];
    const widthMatch: any[] = ["match", ["get", "ISO3166-1-Alpha-3"]];
    highlightedIsos.forEach(iso => {
       colorMatch.push(iso, "#22c55e"); // Neon Green Highlight
       widthMatch.push(iso, 2.5);
    });
    colorMatch.push("rgba(255,255,255,0.05)");
    widthMatch.push(0.5);
    
    return {
      "line-color": colorMatch,
      "line-width": widthMatch
    };
  }, [highlightedIsos]);

  const [zoom, setZoom] = useState(1.5);

  const layerProps = {
    id: "countries-layer",
    type: "fill" as const,
    paint: {
      "fill-color": fillColorExpression as string,
      "fill-color-transition": { duration: 1000 },
      "fill-opacity": 0.8,
    },
  };

  const lineProps = {
    id: "countries-line-layer",
    type: "line" as const,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paint: linePaint as any,
  };

  const getPinSize = (color: string) => {
    if (color === "#ef4444") return 12; // Red
    if (color === "#f97316") return 10; // Orange
    return 8; // Green and Blue
  };

  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_50%)]" onClick={() => setEventTooltip(null)}>
      <Map
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 1.5,
        }}
        style={{ filter: "drop-shadow(0 0 1px rgba(255,255,255,1))" }}
        mapStyle="/hacker-map-style.json"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projection={{ type: "globe" } as any}
        interactiveLayerIds={["countries-layer"]}
        onClick={(e) => {
           const feature = e.features?.[0];
           if (feature?.properties?.['ISO3166-1-Alpha-3']) {
              onCountryClick(feature.properties['ISO3166-1-Alpha-3'] as string);
           }
        }}
        onMouseMove={(e) => {
           const feature = e.features?.[0];
           if (feature?.properties?.['ISO3166-1-Alpha-3']) {
              // Only update if the country actually changed
              const newIso = feature.properties['ISO3166-1-Alpha-3'] as string;
              setHoveredCountry((prev) => {
                if (prev?.iso === newIso) return prev;
                return {
                 iso: newIso,
                 name: (feature.properties.name || newIso) as string,
                 x: e.point.x,
                 y: e.point.y,
                };
              });
           } else {
              setHoveredCountry(null);
           }
        }}
        onMouseLeave={() => setHoveredCountry(null)}
        onZoom={(e) => setZoom(e.viewState.zoom)}
      >
        <Source id="countries" type="geojson" data="/countries.geojson">
          <Layer {...layerProps} />
          <Layer {...lineProps} />
        </Source>

        {/* ── Country Pins ── */}
        {countryPins.map((pin) => {
          const isHighlighted = highlightedIsos?.includes(pin.iso);
          const size = getPinSize(pin.color);
          const isConflict = pin.color === "#ef4444";
          return (
            <Marker
              key={`country-${pin.iso}`}
              longitude={pin.coords[0]}
              latitude={pin.coords[1]}
              anchor="center"
            >
              <div
                className="group relative cursor-pointer"
                style={{ width: size + 8, height: size + 8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCountryClick(pin.iso);
                }}
                title={`${pin.name} — ${pin.category} (${pin.goldsteinLabel})`}
              >
                {/* Pulse ring for high-conflict countries */}
                {isConflict && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-40"
                    style={{ backgroundColor: pin.color }}
                  />
                )}
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full opacity-30 blur-[2px]"
                  style={{ backgroundColor: pin.color }}
                />
                {/* Core pin dot */}
                <div
                  className="absolute rounded-full border transition-all duration-200 group-hover:scale-150"
                  style={{
                    width: size,
                    height: size,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: pin.color,
                    borderColor: isHighlighted ? '#22c55e' : 'rgba(255,255,255,0.6)',
                    borderWidth: isHighlighted ? 2 : 1,
                    boxShadow: isHighlighted
                      ? '0 0 12px #22c55e, 0 0 24px #22c55e55'
                      : `0 0 6px ${pin.color}88`,
                  }}
                />
                {/* ISO Label on hover */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[9px] font-mono font-bold text-white bg-black/80 px-1 py-0.5 rounded whitespace-nowrap">
                    {pin.iso}
                  </span>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* ── Relationship-only country pins ── */}
        {relationshipPins.map((pin) => (
          <Marker
            key={`rel-${pin.iso}`}
            longitude={pin.coords[0]}
            latitude={pin.coords[1]}
            anchor="center"
          >
            <div
              className="group relative cursor-pointer"
              style={{ width: 14, height: 14 }}
              onClick={(e) => {
                e.stopPropagation();
                onCountryClick(pin.iso);
              }}
              title={pin.iso}
            >
              <div
                className="absolute rounded-full border border-white/30 group-hover:scale-150 transition-all duration-200"
                style={{
                  width: 6,
                  height: 6,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(100, 116, 139, 0.6)', // slate dim
                  boxShadow: '0 0 4px rgba(100,116,139,0.4)',
                }}
              />
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[9px] font-mono font-bold text-white/60 bg-black/80 px-1 py-0.5 rounded whitespace-nowrap">
                  {pin.iso}
                </span>
              </div>
            </div>
          </Marker>
        ))}

        {/* ── Live GDELT event markers ── */}
        {eventsData?.features?.map((feature, idx) => {
          const [lon, lat] = feature.geometry.coordinates;
          return (
            <Marker key={`event-${idx}`} longitude={lon} latitude={lat} anchor="center">
              <div style={{ position: 'relative', width: 8, height: 8 }}>
                 <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                 <div 
                   className="relative w-full h-full rounded-full border border-white bg-orange-500 cursor-pointer"
                   onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                     e.stopPropagation();
                     let text = feature.properties.name || "Live Event";
                     const htmlStr = feature.properties.html;
                     if (htmlStr) {
                       const div = document.createElement("div");
                       div.innerHTML = htmlStr;
                       text = div.textContent || text;
                     }
                     setEventTooltip({ text, x: e.clientX, y: e.clientY });
                   }}
                 ></div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {hoveredCountry && !eventTooltip && (
        <div 
          className="fixed bg-card/90 backdrop-blur-sm border border-border px-3 py-1.5 rounded-md text-sm text-foreground shadow-lg pointer-events-none z-50 transition-opacity"
          style={{ left: hoveredCountry.x + 15, top: hoveredCountry.y + 15 }}
        >
          {hoveredCountry.name}
        </div>
      )}
      
      {eventTooltip && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-lg border text-sm max-w-xs pointer-events-none"
          style={{ left: eventTooltip.x + 10, top: eventTooltip.y + 10 }}
        >
          {eventTooltip.text}
        </div>
      )}
    </div>
  );
});

WorldMap.displayName = "WorldMap";
export default WorldMap;
