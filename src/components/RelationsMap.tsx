import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { countryScores, getColor, type Category } from "@/data/countryData";
import { countryCoordinates } from "@/data/countryCoordinates";
import { globalRelations, type RelationEdge, type RelationType } from "@/data/relationships";
import { useGoldsteinScores } from "@/hooks/useGoldsteinScores";
import { fetchGlobalRelationalNews, fetchDedicatedEdgeNews, type RelationalEdge } from "@/services/newsService";

interface RelationsMapProps {
  activeCategory: Category;
  onCountryClick: (iso: string) => void;
}

// Static relation-type colors (used as fallback & legend)
const RELATION_COLORS: Record<RelationType, string> = {
  conflict: "#ef4444",
  tension: "#f97316",
  alliance: "#3b82f6",
  trade: "#22c55e",
};

// Goldstein-driven edge color based on the *average* bilateral tone
function getEdgeColor(
  toneA: number | undefined,
  toneB: number | undefined,
  fallbackType: RelationType
): string {
  if (toneA === undefined && toneB === undefined) return RELATION_COLORS[fallbackType];
  const avg = ((toneA ?? 0) + (toneB ?? 0)) / 2;
  if (avg <= -4) return "#ef4444"; // Deep conflict — red
  if (avg <= -1) return "#f97316"; // Tension — orange
  if (avg <= 2) return "#22c55e";  // Stable — green
  return "#3b82f6";                // Cooperative — blue
}

// Goldstein label for a bilateral average
function getEdgeLabel(toneA: number | undefined, toneB: number | undefined): string {
  if (toneA === undefined && toneB === undefined) return "Unknown";
  const avg = ((toneA ?? 0) + (toneB ?? 0)) / 2;
  if (avg <= -4) return "Conflict";
  if (avg <= -1) return "Tension";
  if (avg <= 2) return "Stable";
  return "Cooperative";
}

const RelationsMap = memo(({ activeCategory, onCountryClick }: RelationsMapProps) => {
  const mapRef = useRef<MapRef>(null);
  const { data: goldsteinScores } = useGoldsteinScores();

  const [hoveredEdge, setHoveredEdge] = useState<{
    edge: RelationEdge;
    articles: RelationalEdge[];
    goldsteinLabel: string;
    edgeColor: string;
    sourceTone: number | undefined;
    targetTone: number | undefined;
    x: number;
    y: number;
  } | null>(null);

  const [selectedPins, setSelectedPins] = useState<string[]>([]);

  const [hoveredPin, setHoveredPin] = useState<{
    iso: string;
    name: string;
    label: string;
    tone: number | undefined;
    connectionCount: number;
    x: number;
    y: number;
  } | null>(null);

  // Fetch live news edges with polling
  const [newsEdges, setNewsEdges] = useState<RelationalEdge[]>([]);
  useEffect(() => {
    const fetchEdges = () => {
      fetchGlobalRelationalNews(activeCategory !== "All" ? activeCategory : undefined)
        .then(setNewsEdges)
        .catch(() => setNewsEdges([]));
    };

    fetchEdges();
    const interval = setInterval(fetchEdges, 300000); // Poll every 5 minutes
    return () => clearInterval(interval);
  }, [activeCategory]);

  const [dedicatedEdgeNews, setDedicatedEdgeNews] = useState<RelationalEdge[]>([]);
  const [isFetchingDedicated, setIsFetchingDedicated] = useState(false);

  useEffect(() => {
    if (selectedPins.length === 2) {
      const src = selectedPins[0];
      const tgt = selectedPins[1];
      const edge = globalRelations.find(
        (r) => (r.source === src && r.target === tgt) || (r.source === tgt && r.target === src)
      );
      if (edge) {
        setIsFetchingDedicated(true);
        fetchDedicatedEdgeNews(src, tgt).then((res) => {
          setDedicatedEdgeNews(res);
          setIsFetchingDedicated(false);
        });
      } else {
        setDedicatedEdgeNews([]);
      }
    } else {
      setDedicatedEdgeNews([]);
    }
  }, [selectedPins]);

  // Count how many connections each country has
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    globalRelations.forEach((r) => {
      counts[r.source] = (counts[r.source] || 0) + 1;
      counts[r.target] = (counts[r.target] || 0) + 1;
    });
    return counts;
  }, []);

  // Country pins with Goldstein labels & colors
  const countryPins = useMemo(() => {
    return Object.entries(countryScores)
      .filter(([, data]) => activeCategory === "All" || data.category === activeCategory)
      .filter(([iso]) => countryCoordinates[iso])
      .map(([iso, data]) => {
        const g = goldsteinScores?.[iso];
        return {
          iso,
          name: data.name,
          coords: countryCoordinates[iso],
          color: g ? g.color : getColor(data.score),
          label: g ? g.label : "Stable",
          tone: g?.avgTone,
        };
      });
  }, [activeCategory, goldsteinScores]);

  // Build extra pins from relationships not in countryScores
  const extraPins = useMemo(() => {
    const scoreIsos = new Set(Object.keys(countryScores));
    const extras = new Set<string>();
    globalRelations.forEach((r) => {
      if (!scoreIsos.has(r.source) && countryCoordinates[r.source]) extras.add(r.source);
      if (!scoreIsos.has(r.target) && countryCoordinates[r.target]) extras.add(r.target);
    });
    return [...extras].map((iso) => ({
      iso,
      name: iso,
      coords: countryCoordinates[iso],
      color: "#64748b",
      label: "Unscored",
      tone: undefined as number | undefined,
    }));
  }, []);

  const allPins = useMemo(() => [...countryPins, ...extraPins], [countryPins, extraPins]);

  // Filter edges that have coordinates for both endpoints
  const visibleEdges = useMemo(() => {
    return globalRelations.filter(
      (r) => countryCoordinates[r.source] && countryCoordinates[r.target]
    );
  }, []);

  // Build GeoJSON LineString features with Goldstein-driven colors
  const edgesGeoJSON = useMemo(() => {
    const features = visibleEdges.map((edge, idx) => {
      const src = countryCoordinates[edge.source];
      const tgt = countryCoordinates[edge.target];
      const toneA = goldsteinScores?.[edge.source]?.avgTone;
      const toneB = goldsteinScores?.[edge.target]?.avgTone;
      const color = getEdgeColor(toneA, toneB, edge.type);

      // Compute an intensity factor: combine edge weight with Goldstein negativity
      const avgTone = ((toneA ?? 0) + (toneB ?? 0)) / 2;
      const intensity = Math.min(10, edge.weight + Math.max(0, -avgTone));

      return {
        type: "Feature" as const,
        id: idx,
        properties: {
          source: edge.source,
          target: edge.target,
          type: edge.type,
          weight: edge.weight,
          intensity,
          color,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: [src, tgt],
        },
      };
    });
    return { type: "FeatureCollection" as const, features };
  }, [visibleEdges, goldsteinScores]);

  // For hovering: find news articles that mention both countries
  const findArticlesForEdge = useCallback(
    (source: string, target: string) => {
      return newsEdges.filter(
        (ne) =>
          (ne.source === source && ne.target === target) ||
          (ne.source === target && ne.target === source)
      );
    },
    [newsEdges]
  );

  // Handle hover on the edge lines
  const handleEdgeHover = useCallback(
    (e: any) => {
      const feature = e.features?.[0];
      if (!feature) {
        setHoveredEdge(null);
        return;
      }
      const src = feature.properties.source;
      const tgt = feature.properties.target;
      const edge = globalRelations.find(
        (r) =>
          (r.source === src && r.target === tgt) || (r.source === tgt && r.target === src)
      );
      if (!edge) return;
      const articles = findArticlesForEdge(src, tgt);
      const toneA = goldsteinScores?.[src]?.avgTone;
      const toneB = goldsteinScores?.[tgt]?.avgTone;
      setHoveredEdge({
        edge,
        articles,
        goldsteinLabel: getEdgeLabel(toneA, toneB),
        edgeColor: getEdgeColor(toneA, toneB, edge.type),
        sourceTone: toneA,
        targetTone: toneB,
        x: e.point.x,
        y: e.point.y,
      });
    },
    [findArticlesForEdge, goldsteinScores]
  );

  // Deriving Bilateral Edge data specifically for selections
  const selectedEdgeData = useMemo(() => {
    if (selectedPins.length !== 2) return null;
    const [src, tgt] = selectedPins;
    const edge = globalRelations.find(
      (r) => (r.source === src && r.target === tgt) || (r.source === tgt && r.target === src)
    );
    if (!edge) return { empty: true, src, tgt }; // Selected 2 pins but no relation

    const toneA = goldsteinScores?.[src]?.avgTone;
    const toneB = goldsteinScores?.[tgt]?.avgTone;
    return {
      edge,
      articles: dedicatedEdgeNews,
      goldsteinLabel: getEdgeLabel(toneA, toneB),
      edgeColor: getEdgeColor(toneA, toneB, edge.type),
      sourceTone: toneA,
      targetTone: toneB,
    };
  }, [selectedPins, dedicatedEdgeNews, goldsteinScores]);
  // Fill color for underlying country areas
  const fillColorExpression = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expression: any = ["match", ["get", "ISO3166-1-Alpha-3"]];
    for (const [iso, data] of Object.entries(countryScores)) {
      if (activeCategory !== "All" && data.category !== activeCategory) {
        expression.push(iso, "hsl(220, 10%, 12%)");
      } else {
        expression.push(iso, "hsl(220, 10%, 14%)");
      }
    }
    expression.push("hsl(0, 0%, 6%)");
    return expression;
  }, [activeCategory]);

  const getPinSize = (color: string) => {
    if (color === "#ef4444") return 14;
    if (color === "#f97316") return 12;
    return 10;
  };

  const formatTone = (tone: number | undefined) => {
    if (tone === undefined) return "N/A";
    return tone > 0 ? `+${tone.toFixed(1)}` : tone.toFixed(1);
  };

  return (
    <div className="absolute inset-0 bg-background">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 20,
          latitude: 25,
          zoom: 1.8,
        }}
        mapStyle="/hacker-map-style.json"
        interactiveLayerIds={["relations-edge-layer"]}
        onMouseMove={(e) => {
          const feature = e.features?.[0];
          if (feature && feature.layer?.id === "relations-edge-layer") {
            handleEdgeHover(e);
          } else {
            setHoveredEdge(null);
          }
        }}
        onClick={(e) => {
          const feature = e.features?.[0];
          if (feature && feature.layer?.id === "relations-edge-layer") {
            const src = feature.properties.source;
            const tgt = feature.properties.target;
            setSelectedPins([src, tgt]);
          } else {
            setSelectedPins([]); // Deselect when clicking map background/polygons
          }
        }}
      >
        {/* Country fill */}
        <Source id="countries" type="geojson" data="/countries.geojson">
          <Layer
            id="countries-fill"
            type="fill"
            paint={{
              "fill-color": fillColorExpression as string,
              "fill-opacity": 0.6,
            }}
          />
          <Layer
            id="countries-border"
            type="line"
            paint={{
              "line-color": "rgba(255,255,255,0.06)",
              "line-width": 0.5,
            }}
          />
        </Source>

        {/* Goldstein-colored relation connection lines */}
        <Source id="relations-edges" type="geojson" data={edgesGeoJSON}>
          <Layer
            id="relations-edge-layer"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": [
                "interpolate",
                ["linear"],
                ["get", "intensity"],
                1, 0.6,
                5, 1.8,
                10, 3.5,
              ],
              "line-opacity": hoveredPin
                ? [
                    "case",
                    ["==", ["get", "source"], hoveredPin.iso], 0.7,
                    ["==", ["get", "target"], hoveredPin.iso], 0.7,
                    0.2, // Keep background lines visible
                  ]
                : selectedPins.length === 2
                ? [
                    "case",
                    ["all", ["==", ["get", "source"], selectedPins[0]], ["==", ["get", "target"], selectedPins[1]]], 0.85,
                    ["all", ["==", ["get", "source"], selectedPins[1]], ["==", ["get", "target"], selectedPins[0]]], 0.85,
                    0.2, // Keep background lines visible
                  ]
                : selectedPins.length === 1
                ? [
                    "case",
                    ["==", ["get", "source"], selectedPins[0]], 0.7,
                    ["==", ["get", "target"], selectedPins[0]], 0.7,
                    0.2, // Keep background lines visible
                  ]
                : hoveredEdge
                ? [
                    "case",
                    ["all", ["==", ["get", "source"], hoveredEdge.edge.source], ["==", ["get", "target"], hoveredEdge.edge.target]], 0.8,
                    ["all", ["==", ["get", "source"], hoveredEdge.edge.target], ["==", ["get", "target"], hoveredEdge.edge.source]], 0.8,
                    0.2, // Keep background lines visible
                  ]
                : 0.35, // Default base visibility when nothing is hovered
            }}
          />
        </Source>

        {/* Country pins */}
        {allPins.map((pin) => {
          const size = getPinSize(pin.color);
          const isConflict = pin.color === "#ef4444";
          return (
            <Marker
              key={`flat-pin-${pin.iso}`}
              longitude={pin.coords[0]}
              latitude={pin.coords[1]}
              anchor="center"
            >
              <div
                className="group relative cursor-pointer"
                style={{ width: size + 10, height: size + 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCountryClick(pin.iso); // Open country drawer directly
                }}
                onMouseEnter={(e) => {
                  setHoveredPin({
                    iso: pin.iso,
                    name: pin.name,
                    label: pin.label,
                    tone: pin.tone,
                    connectionCount: connectionCounts[pin.iso] || 0,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onMouseLeave={() => setHoveredPin(null)}
              >
                {isConflict && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: pin.color }}
                  />
                )}
                {selectedPins.includes(pin.iso) && (
                  <div
                    className="absolute inset-0 rounded-full border-2 border-white animate-pulse"
                    style={{
                      width: size + 8,
                      height: size + 8,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      boxShadow: `0 0 15px ${pin.color}`,
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 rounded-full opacity-25 blur-[3px]"
                  style={{ backgroundColor: pin.color }}
                />
                <div
                  className="absolute rounded-full border border-white/60 transition-all duration-200 group-hover:scale-150"
                  style={{
                    width: size,
                    height: size,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: pin.color,
                    boxShadow: `0 0 8px ${pin.color}88`,
                  }}
                />
                {/* Always-visible label */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 pointer-events-none">
                  <span className="text-[8px] font-mono font-bold text-white/70 bg-black/70 px-1 py-0.5 rounded whitespace-nowrap">
                    {pin.iso}
                  </span>
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* ── Edge hover tooltip — Goldstein-rich ── */}
      {hoveredEdge && (
        <div
          className="fixed z-50 bg-black/90 backdrop-blur-xl border border-white/15 px-5 py-4 rounded-2xl shadow-2xl pointer-events-none max-w-[400px]"
          style={{ left: hoveredEdge.x + 16, top: hoveredEdge.y + 16 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: hoveredEdge.edgeColor }}
            />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {countryScores[hoveredEdge.edge.source]?.name || hoveredEdge.edge.source}
              {" — "}
              {countryScores[hoveredEdge.edge.target]?.name || hoveredEdge.edge.target}
            </span>
          </div>

          {/* Goldstein bilateral card */}
          <div className="flex items-center gap-3 mb-3 bg-white/5 rounded-lg px-3 py-2">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-white/40 uppercase">
                {hoveredEdge.edge.source}
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {formatTone(hoveredEdge.sourceTone)}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full h-px" style={{ backgroundColor: hoveredEdge.edgeColor }} />
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1"
                style={{
                  color: hoveredEdge.edgeColor,
                  backgroundColor: `${hoveredEdge.edgeColor}20`,
                  border: `1px solid ${hoveredEdge.edgeColor}40`,
                }}
              >
                {hoveredEdge.goldsteinLabel}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-white/40 uppercase">
                {hoveredEdge.edge.target}
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {formatTone(hoveredEdge.targetTone)}
              </span>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono mb-2">
            <span>Weight: {hoveredEdge.edge.weight}/10</span>
            <span>·</span>
            <span className="capitalize">{hoveredEdge.edge.type}</span>
          </div>

          {/* Related news articles */}
          {hoveredEdge.articles.length > 0 ? (
            <div className="space-y-2 border-t border-white/10 pt-2">
              <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                </span>
                Active Intelligence Found ({hoveredEdge.articles.length})
              </div>
              {hoveredEdge.articles.slice(0, 4).map((ne, idx) => (
                <a key={idx} href={ne.article.url} target="_blank" rel="noopener noreferrer" className="block border-l-2 pl-2 hover:bg-white/5 transition-colors cursor-pointer pointer-events-auto" style={{ borderColor: hoveredEdge.edgeColor + '60' }}>
                  <p className="text-[11px] text-white/80 leading-snug line-clamp-2 hover:underline">
                    {ne.article.title}
                  </p>
                  <span className="text-[9px] text-white/40 font-mono">
                    {ne.article.source.name} ·{" "}
                    {new Date(ne.article.publishedAt).toLocaleDateString()}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-white/30 font-mono border-t border-white/10 pt-2">
              No live news coverage found for this link.
            </div>
          )}
        </div>
      )}

      {/* ── Pin hover tooltip — enhanced ── */}
      {hoveredPin && !hoveredEdge && (
        <div
          className="fixed z-50 bg-black/90 backdrop-blur-xl border border-white/15 px-4 py-3 rounded-xl shadow-2xl pointer-events-none min-w-[180px]"
          style={{ left: hoveredPin.x + 16, top: hoveredPin.y + 16 }}
        >
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-white">{hoveredPin.name}</div>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full border bg-black/40" style={{ borderColor: `${hoveredPin.label === "Conflict" ? "#ef4444" : hoveredPin.label === "Tension" ? "#f97316" : hoveredPin.label === "Cooperative" ? "#3b82f6" : "#22c55e"}40` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hoveredPin.label === "Conflict" ? "#ef4444" : hoveredPin.label === "Tension" ? "#f97316" : hoveredPin.label === "Cooperative" ? "#3b82f6" : "#22c55e" }} />
              <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: hoveredPin.label === "Conflict" ? "#ef4444" : hoveredPin.label === "Tension" ? "#f97316" : hoveredPin.label === "Cooperative" ? "#3b82f6" : "#22c55e" }}>
                {hoveredPin.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/50 font-mono">
              {hoveredPin.iso}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/40 font-mono">
            <span>Tone: {formatTone(hoveredPin.tone)}</span>
            <span>·</span>
            <span>{hoveredPin.connectionCount} link{hoveredPin.connectionCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* ── Persistent Bilateral Tooltip ── */}
      {selectedEdgeData && !selectedEdgeData.empty && selectedEdgeData.edge && (
        <div
          className="absolute z-40 bottom-6 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-white/15 px-6 py-5 rounded-3xl shadow-2xl min-w-[360px] max-w-[450px]"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedEdgeData.edgeColor }}
            />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {countryScores[selectedEdgeData.edge.source]?.name || selectedEdgeData.edge.source}
              {" — "}
              {countryScores[selectedEdgeData.edge.target]?.name || selectedEdgeData.edge.target}
            </span>
            <button onClick={() => setSelectedPins([])} className="ml-auto text-white/40 hover:text-white shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Goldstein bilateral card */}
          <div className="flex items-center gap-3 mb-3 bg-white/5 rounded-lg px-3 py-2">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-white/40 uppercase">
                {selectedEdgeData.edge.source}
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {formatTone(selectedEdgeData.sourceTone)}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full h-px" style={{ backgroundColor: selectedEdgeData.edgeColor }} />
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1"
                style={{
                  color: selectedEdgeData.edgeColor,
                  backgroundColor: `${selectedEdgeData.edgeColor}20`,
                  border: `1px solid ${selectedEdgeData.edgeColor}40`,
                }}
              >
                {selectedEdgeData.goldsteinLabel}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-white/40 uppercase">
                {selectedEdgeData.edge.target}
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {formatTone(selectedEdgeData.targetTone)}
              </span>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono mb-2">
            <span>Weight: {selectedEdgeData.edge.weight}/10</span>
            <span>·</span>
            <span className="capitalize">{selectedEdgeData.edge.type}</span>
          </div>

          {/* Related news articles */}
          {isFetchingDedicated ? (
            <div className="space-y-4 border-t border-white/10 pt-4">
               <div className="flex flex-col items-center justify-center py-2 space-y-3">
                 <span className="relative flex h-4 w-4">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                 </span>
                 <span className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-widest animate-pulse">Running Targeted Intel Query...</span>
               </div>
            </div>
          ) : selectedEdgeData.articles.length > 0 ? (
            <div className="space-y-2 border-t border-white/10 pt-2">
              <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                </span>
                Active Intel Hub ({selectedEdgeData.articles.length})
              </div>
              {selectedEdgeData.articles.slice(0, 4).map((ne, idx) => (
                <a key={idx} href={ne.article.url} target="_blank" rel="noopener noreferrer" className="block border-l-2 pl-2 hover:bg-white/5 transition-colors cursor-pointer pointer-events-auto" style={{ borderColor: selectedEdgeData.edgeColor + '60' }}>
                  <p className="text-[11px] text-white/80 leading-snug line-clamp-2 hover:underline">
                    {ne.article.title}
                  </p>
                  <span className="text-[9px] text-white/40 font-mono">
                    {ne.article.source.name} ·{" "}
                    {new Date(ne.article.publishedAt).toLocaleDateString()}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-white/30 font-mono border-t border-white/10 pt-2">
              No live news coverage found for this specific bilateral link today.
            </div>
          )}
        </div>
      )}

      {selectedEdgeData && selectedEdgeData.empty && (
        <div className="absolute z-40 bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-xl flex items-center gap-3">
           <span className="text-xs font-mono text-white/60 uppercase tracking-widest">No primary bridge found between {selectedEdgeData.src} and {selectedEdgeData.tgt}</span>
           <button onClick={() => setSelectedPins([])} className="text-white/40 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
        </div>
      )}

      {/* ── Goldstein Legend ── */}
      <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-xl z-30">
        <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-2">
          Goldstein Scale
        </div>
        {[
          { label: "Conflict", color: "#ef4444", range: "≤ −4" },
          { label: "Tension", color: "#f97316", range: "−4 to −1" },
          { label: "Stable", color: "#22c55e", range: "−1 to +2" },
          { label: "Cooperative", color: "#3b82f6", range: "> +2" },
        ].map((tier) => (
          <div key={tier.label} className="flex items-center gap-2 py-0.5">
            <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: tier.color }} />
            <span className="text-[10px] text-white/60">{tier.label}</span>
            <span className="text-[9px] text-white/30 font-mono ml-auto">{tier.range}</span>
          </div>
        ))}
        <div className="border-t border-white/10 mt-2 pt-2">
          <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1">
            Relation Type
          </div>
          {(Object.entries(RELATION_COLORS) as [RelationType, string][]).map(([type]) => (
            <div key={type} className="flex items-center gap-2 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full opacity-50" style={{ backgroundColor: RELATION_COLORS[type] }} />
              <span className="text-[9px] text-white/40 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

RelationsMap.displayName = "RelationsMap";
export default RelationsMap;
