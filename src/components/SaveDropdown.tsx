import { Article } from "@/types";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Bookmark, BookmarkCheck, FolderOpen, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SaveDropdownProps {
  article: Article;
  mode?: "icon-only" | "full-button";
}

export const SaveDropdown = ({ article, mode = "icon-only" }: SaveDropdownProps) => {
  const { isBookmarked, saveBookmark, removeBookmark, getFolders, createFolder } = useBookmarks();
  
  const savedFolder = isBookmarked(article.url);
  const folders = getFolders();

  const handleSave = (e: React.MouseEvent, folder: string) => {
    e.stopPropagation();
    saveBookmark(article, folder);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeBookmark(article.url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        {mode === "icon-only" ? (
          <button className={`shrink-0 pt-1 transition-colors z-10 ${savedFolder ? "text-primary hover:text-red-500" : "text-muted-foreground hover:text-primary"}`} title={savedFolder ? `Saved in ${savedFolder}` : "Save to Vault"}>
            {savedFolder ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        ) : (
          <button className={`shrink-0 p-2 sm:p-3 mt-1 border transition-colors ${savedFolder ? 'bg-primary text-primary-foreground border-primary hover:bg-red-500/20 hover:text-red-500 hover:border-red-500' : 'bg-background text-primary border-primary hover:bg-primary/20'}`} title={savedFolder ? `Saved in ${savedFolder}` : "Save to Vault"}>
            {savedFolder ? <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        )}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent onClick={(e) => e.stopPropagation()} className="w-48 bg-black border border-border font-mono rounded-none text-foreground z-[150]">
        {savedFolder ? (
          <>
            <DropdownMenuLabel className="text-[10px] text-primary uppercase font-bold tracking-widest">Saved in: {savedFolder}</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleRemove} className="text-red-500 hover:text-red-400 hover:bg-red-950/30 cursor-pointer rounded-none text-xs uppercase font-bold py-2 focus:bg-red-950/30 focus:text-red-400">
              [ REMOVE BOOKMARK ]
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Move to...</DropdownMenuLabel>
          </>
        ) : (
          <DropdownMenuLabel className="text-[10px] text-primary uppercase font-bold tracking-widest">Save to Vault...</DropdownMenuLabel>
        )}
        
        {folders.map(f => (
           <DropdownMenuItem 
             key={f} 
             onClick={(e) => handleSave(e as any, f)} 
             className={`cursor-pointer rounded-none text-xs uppercase py-2 flex gap-2 items-center hover:bg-secondary hover:text-primary focus:bg-secondary focus:text-primary ${savedFolder === f ? "text-primary font-bold" : ""}`}
             disabled={savedFolder === f}
           >
             <FolderOpen className="w-3 h-3" />
             {f}
           </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            const name = window.prompt("ALLOCATE NEW DIRECTORY NAME:");
            if (name) {
              createFolder(name);
              saveBookmark(article, name);
            }
          }}
          className="cursor-pointer rounded-none text-xs uppercase py-2 flex gap-2 items-center text-muted-foreground hover:bg-secondary hover:text-primary focus:bg-secondary focus:text-primary"
        >
          <Plus className="w-3 h-3" />
          [ NEW FOLDER ]
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
