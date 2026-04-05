import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ArticleReaderModal } from "@/components/ArticleReaderModal";
import { SaveDropdown } from "@/components/SaveDropdown";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Article } from "@/types";

interface SavedDrawerProps {
  open: boolean;
  activeFolder: string;
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

export const SavedDrawer = ({ open, activeFolder, onClose }: SavedDrawerProps) => {
  const { bookmarks } = useBookmarks();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const folderArticles = bookmarks[activeFolder] || [];

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
        <SheetContent className="bg-black/40 backdrop-blur-2xl border-l border-white/10 w-[360px] sm:w-[500px] overflow-y-auto p-0 shadow-2xl font-sans">
          <div className="p-6 sticky top-0 bg-transparent z-10 border-b border-white/10">
            <SheetHeader>
              <SheetTitle className="text-white text-2xl font-bold tracking-tight flex items-center gap-2 truncate">
                <span className="text-primary text-3xl mb-1">/</span> {activeFolder}
              </SheetTitle>
              <SheetDescription className="text-white/60 font-medium text-sm">
                {folderArticles.length} Saved Dispatches
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="p-6 space-y-4">
            {folderArticles.length === 0 ? (
              <p className="text-sm font-medium text-white/40 p-6 border border-white/10 rounded-2xl border-dashed text-center">
                No intelligence stored in this directory.
              </p>
            ) : (
              folderArticles.map((article, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedArticle(article)}
                  className="w-full text-left block rounded-2xl border border-white/10 p-4 bg-white/5 hover:bg-white/10 transition-all group relative hover:-translate-y-0.5 shadow-sm"
                >
                  <div className="flex gap-4 items-start">
                    <div className="z-10 pt-0.5">
                      <SaveDropdown article={article} />
                    </div>
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage}
                        alt=""
                        className="w-12 h-12 object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity grayscale border border-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1 pr-6">
                      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2 font-mono uppercase">
                        <span className="text-[9px] text-muted-foreground truncate border border-border px-1 py-0.5 bg-background">
                          {article.source.name}
                        </span>
                        <span className="text-[9px] text-primary">
                          [{timeAgo(article.publishedAt)}]
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ArticleReaderModal 
        article={selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
      />
    </>
  );
};
