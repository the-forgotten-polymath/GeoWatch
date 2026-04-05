import { useEffect, useState } from "react";
import { countryScores, getCountryTime, type Category } from "@/data/countryData";
import { fetchNews } from "@/services/newsService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useGeminiAnalysis, Persona } from "@/hooks/useGeminiAnalysis";
import { aiService } from "@/services/aiService";
import { ArticleReaderModal } from "@/components/ArticleReaderModal";
import { FormattedText } from "@/components/FormattedText";
import { Article } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGoldsteinScores } from "@/hooks/useGoldsteinScores";

interface CountryDrawerProps {
  iso: string | null;
  onClose: () => void;
  activeCategory: Category;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const CountryDrawer = ({ iso, onClose, activeCategory }: CountryDrawerProps) => {
  const data = iso ? countryScores[iso] : null;
  const { data: goldsteinScores } = useGoldsteinScores();
  const countryGoldstein = iso && goldsteinScores ? goldsteinScores[iso] : null;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [newsSources, setNewsSources] = useState<string[]>([]);
  const [localTime, setLocalTime] = useState<string | null>(null);
  
  // Real-time local clock
  useEffect(() => {
    if (!iso) return;
    setLocalTime(getCountryTime(iso));
    const interval = setInterval(() => {
      setLocalTime(getCountryTime(iso));
    }, 60000);
    return () => clearInterval(interval);
  }, [iso]);
  
  const { analyze, reset, results, loading: geminiLoading, error: geminiError, hasApiKey } = useGeminiAnalysis();

  // Reset analysis whenever a different country is selected
  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  useEffect(() => {
    if (!iso || !data) {
      setArticles([]);
      setNewsSources([]);
      return;
    }

    const loadNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchNews(iso, data.name, activeCategory);
        setArticles(result.articles);
        setNewsSources(result.sources);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load news");
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [iso, data, activeCategory]);

  return (
    <Sheet open={!!iso} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="bg-black/40 backdrop-blur-2xl border-l border-white/10 w-[95vw] sm:max-w-[700px] md:max-w-[850px] shadow-2xl p-6 font-sans flex flex-col h-full overflow-hidden">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-white text-3xl font-bold tracking-tight flex items-center justify-between">
            <div className="flex items-center">
              {localTime && <span className="font-mono text-primary text-xl mr-3 bg-white/5 border border-white/10 px-2 py-0.5 rounded shadow-sm">{localTime}</span>}
              {data?.name || iso || "Unknown"}
            </div>
            {countryGoldstein && (
              <div className="flex flex-col items-end shrink-0 hidden sm:flex">
                <span className="text-[10px] uppercase font-mono tracking-widest text-white/50 mb-0.5">Current State</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-widest" style={{ color: countryGoldstein.color }}>{countryGoldstein.label}</span>
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: countryGoldstein.color, boxShadow: `0 0 10px ${countryGoldstein.color}` }}></span>
                </div>
              </div>
            )}
          </SheetTitle>
          <SheetDescription className="text-white/70 text-sm font-medium mt-1 flex justify-between items-center sm:hidden">
             {countryGoldstein && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: countryGoldstein.color, boxShadow: `0 0 5px ${countryGoldstein.color}` }}></span>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: countryGoldstein.color }}>{countryGoldstein.label}</span>
                </div>
             )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 flex-1 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 min-h-0 overflow-hidden">
          {/* Left Column: News Array */}
          <div className="flex flex-col h-full min-h-0 md:border-r border-white/10 md:pr-4">
            <h3 className="text-sm font-bold tracking-wide text-white/50 border-b border-white/10 pb-2 mb-4 shrink-0 flex items-center gap-2">
              Latest Dispatches
              {newsSources.length > 0 && (
                <span className="flex gap-1 ml-auto">
                  {newsSources.map((s) => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase font-mono">
                      {s}
                    </span>
                  ))}
                </span>
              )}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-8">
              {loading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl p-4 bg-white/5 border border-white/10 animate-pulse">
                      <div className="h-3 bg-white/20 rounded-full w-3/4 mb-3" />
                      <div className="h-2 bg-white/10 rounded-full w-1/2" />
                    </div>
                  ))}
                </>
              )}

              {error && (
                <div className="border border-destructive/50 p-3 bg-destructive/10 text-xs text-destructive font-mono uppercase">
                  [ERR] {error}
                </div>
              )}

              {!loading && !error && articles.length === 0 && (
                <p className="text-sm text-muted-foreground">No articles found.</p>
              )}

              {!loading &&
                articles.map((article, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedArticle(article)}
                    className="w-full text-left block rounded-2xl border border-white/10 p-3 bg-white/5 hover:bg-white/10 transition-all group relative hover:-translate-y-0.5 shadow-sm"
                  >
                    <div className="flex gap-4 items-start">
                      {article.urlToImage && (
                        <img
                          src={article.urlToImage}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                          <FormattedText text={article.title} />
                        </p>
                        <div className="flex items-center gap-2 mt-2 font-medium flex-wrap">
                          <div className="flex gap-1.5 flex-wrap">
                            {article.allSources && article.allSources.length > 0 ? (
                               article.allSources.map((s, idx) => (
                                 <span key={idx} className="text-[9px] font-mono text-white/50 bg-white/10 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                   {s.name === "The Guardian" ? "Guardian" : s.name}
                                 </span>
                               ))
                            ) : (
                              <span className="text-[9px] font-mono text-white/50 bg-white/10 rounded px-1.5 py-0.5 uppercase tracking-wide max-w-[100px] truncate">
                                {article.source.name}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-primary/80 ml-auto">
                            {timeAgo(article.publishedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Right Column: AI Analysis */}
          <div className="flex flex-col h-full min-h-0 bg-black/20 rounded-xl md:bg-transparent md:rounded-none p-4 md:p-0 border border-white/5 md:border-none">
            {hasApiKey && articles.length > 0 ? (
              <div className="flex flex-col h-full">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between shrink-0 mb-4 border-b border-white/10 pb-2">
                  <span className="flex items-center gap-2">
                    &gt; AI NEURAL ANALYSIS
                    <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-primary font-mono font-bold tracking-normal uppercase">
                       {aiService.getProviderName()}
                    </span>
                  </span>
                  {geminiLoading && <span className="text-[10px] text-primary animate-pulse">[PROCESSING]</span>}
                </h3>
                
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
                  {!results.Analyst && !geminiLoading && !geminiError && (
                    <button
                      onClick={() => analyze(articles)}
                      className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold font-mono tracking-widest transition-colors uppercase flex items-center justify-center gap-2"
                    >
                      Execute Analysis Protocol
                    </button>
                  )}

                  {geminiError ? (
                     <div className="text-xs font-mono uppercase text-destructive border border-destructive p-2 bg-destructive/10">[ERR] {geminiError}</div>
                  ) : (results.Analyst || geminiLoading) ? (
                     <Tabs defaultValue="Analyst" className="w-full flex-col flex">
                       <TabsList className="w-full grid grid-cols-3 rounded-none bg-background border border-border p-0 h-auto shrink-0 sticky top-0 z-10">
                         <TabsTrigger value="Analyst" className="rounded-none text-[10px] uppercase font-bold py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analyst</TabsTrigger>
                         <TabsTrigger value="Humanist" className="rounded-none text-[10px] uppercase font-bold py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-x border-border">Humanist</TabsTrigger>
                         <TabsTrigger value="Strategist" className="rounded-none text-[10px] uppercase font-bold py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Strategist</TabsTrigger>
                       </TabsList>
                       
                       <div className="mt-2">
                         {(["Analyst", "Humanist", "Strategist"] as Persona[]).map((persona) => {
                            const result = results[persona];
                            return (
                              <TabsContent key={persona} value={persona} className="text-sm text-foreground m-0">
                                {geminiLoading && !result ? (
                                  <div className="space-y-2 animate-pulse border border-border p-3">
                                    <div className="h-2 bg-muted w-full"></div>
                                    <div className="h-2 bg-muted w-5/6"></div>
                                    <div className="h-2 bg-muted w-3/4"></div>
                                  </div>
                                ) : result ? (
                                  <div className="bg-background p-3 border border-border shadow-sm">
                                    <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                                       <span className="text-[10px] uppercase font-bold text-muted-foreground">Confidence Model</span>
                                       <span className="font-mono text-xs bg-primary/10 text-primary border border-primary/30 px-2 py-0.5">[{result.confidence}%]</span>
                                    </div>
                                    <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                                      {result.summary?.map?.((para, idx) => (
                                         <p key={idx} className="text-foreground">{para}</p>
                                      ))}
                                    </div>
                                    {result.entities?.length > 0 && (
                                       <div className="pt-3 mt-3 border-t border-border">
                                         <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">&gt; DETECTED ENTITIES</span>
                                         <div className="flex flex-wrap gap-1.5 flex-row">
                                            {result.entities.map((ent, idx) => (
                                               <span key={idx} className="cursor-pointer bg-background text-primary text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-primary/40 hover:bg-primary/20 transition-colors">
                                                 {ent.name}
                                               </span>
                                            ))}
                                         </div>
                                       </div>
                                    )}
                                  </div>
                                ) : null}
                              </TabsContent>
                            );
                         })}
                       </div>
                     </Tabs>
                  ) : null}
                </div>
              </div>
            ) : (
               <div className="flex flex-col h-full items-center justify-center opacity-30">
                 <span className="text-xs font-mono tracking-widest uppercase">Analysis Unavailable</span>
               </div>
            )}
          </div>
        </div>
      </SheetContent>

      <ArticleReaderModal 
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </Sheet>
  );
};

export default CountryDrawer;
