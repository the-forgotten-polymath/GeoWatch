import { useEffect, useState } from "react";
import { fetchLiveGlobalNews } from "@/services/newsService";
import type { Article } from "@/types";
import { FormattedText } from "@/components/FormattedText";
import { ChevronDown, ChevronUp } from "lucide-react";

export const LiveNewsTab = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const loadNews = async () => {
    setLoading(true);
    const news = await fetchLiveGlobalNews();
    setArticles(news);
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-12 left-6 w-80 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl z-40 flex flex-col max-h-[42vh] pointer-events-auto">
      <div 
        className="bg-white/5 border-b border-white/10 p-3 flex justify-between items-center shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live News Feed
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-[9px] font-mono text-primary animate-pulse tracking-widest">SYNCING...</span>}
          {isMinimized ? <ChevronUp className="w-3 h-3 text-white/50" /> : <ChevronDown className="w-3 h-3 text-white/50" />}
        </div>
      </div>
      
      {!isMinimized && (
        <div className="overflow-y-auto p-3 flex flex-col gap-3">
        {!loading && articles.length === 0 && (
          <p className="text-xs text-white/40 font-mono text-center py-4">No intercepts found.</p>
        )}
        {articles.map((article, idx) => (
          <a
            key={idx}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border-l-2 border-white/10 hover:border-primary pl-3 py-1 transition-all"
          >
            <p className="text-[11px] font-semibold text-white/80 leading-snug group-hover:text-primary transition-colors line-clamp-3">
              <FormattedText text={article.title} />
            </p>
            <div className="flex gap-2 items-center mt-1.5 font-mono flex-wrap">
               <span className="text-[9px] text-white/40">{new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               <div className="flex gap-1 flex-wrap">
                 {article.allSources && article.allSources.length > 0 ? (
                   article.allSources.map((s, i) => (
                     <span key={i} className="text-[8px] px-1 py-0.5 rounded bg-white/10 text-white/60 uppercase tracking-wider">
                       {s.name === "The Guardian" ? "Guardian" : s.name}
                     </span>
                   ))
                 ) : (
                   <span className="text-[8px] px-1 py-0.5 rounded bg-white/10 text-white/60 uppercase tracking-wider">
                     {article.source.name}
                   </span>
                 )}
               </div>
            </div>
          </a>
        ))}
      </div>
      )}
    </div>
  );
};
