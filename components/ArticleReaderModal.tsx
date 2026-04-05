import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FormattedText } from "@/components/FormattedText";
import { Article } from "@/types";
import { ExternalLink } from "lucide-react";

interface ArticleReaderModalProps {
  article: Article | null;
  onClose: () => void;
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

export const ArticleReaderModal = ({ article, onClose }: ArticleReaderModalProps) => {
  if (!article) return null;

  return (
    <Dialog open={!!article} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-0 overflow-hidden text-white font-sans shadow-[0_16px_40px_rgba(0,0,0,0.5)] z-[110]">
        <div className="border-b border-white/10 bg-white/5 p-5 flex justify-between items-start">
          <div className="flex gap-4 items-start w-full">
            <div className="flex-1 min-w-0 pr-4 mt-1">
              <div className="text-[10px] text-primary font-bold tracking-widest mb-1 uppercase">Datastream Intercepted</div>
              <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight truncate whitespace-normal line-clamp-3">
                <FormattedText text={article.title} />
              </DialogTitle>
            </div>
          </div>
        </div>
        
        {article.urlToImage && (
          <div className="w-full h-56 border-b border-white/10 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            <img src={article.urlToImage} alt="Article Thumbnail" className="w-full h-full object-cover opacity-80" />
          </div>
        )}

        <div className="p-8 overflow-y-auto max-h-[50vh] relative z-20">
          <div className="flex gap-3 text-xs font-semibold text-white/60 mb-6 flex-wrap">
            <span className="bg-white/10 px-3 py-1 rounded-full">{article.source.name}</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">{timeAgo(article.publishedAt)}</span>
          </div>

          <DialogDescription className="text-base text-white/90 leading-relaxed space-y-5">
             {article.description && (
               <p className="font-semibold text-white bg-white/5 border-l-4 border-primary rounded-r-xl pl-5 py-3 shadow-inner">
                 <FormattedText text={article.description} />
               </p>
             )}
             {article.content && (
               <p className="text-white/80"><FormattedText text={article.content.replace(/\[\+\d+ chars\]$/, '')} /></p>
             )}
          </DialogDescription>
        </div>
        
        <div className="p-5 border-t border-white/10 bg-black/40 flex justify-end items-center flex-wrap gap-3">
           {(article.allSources && article.allSources.length > 0) ? (
             article.allSources.map((src, i) => (
               <a 
                 key={i}
                 href={src.url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/20 text-white text-xs font-bold tracking-wide hover:bg-white/20 hover:border-white/40 transition-all shadow-sm"
               >
                 <span>Open on {src.name === "The Guardian" ? "Guardian" : src.name}</span>
                 <ExternalLink className="w-4 h-4 ml-1" />
               </a>
             ))
           ) : (
             <a 
               href={article.url} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/20 text-white text-xs font-bold tracking-wide hover:bg-white/20 hover:border-white/40 transition-all shadow-sm"
             >
               <span>Open Official Dispatch</span>
               <ExternalLink className="w-4 h-4 ml-1" />
             </a>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
