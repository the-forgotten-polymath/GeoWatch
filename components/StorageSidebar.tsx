import { useBookmarks } from "@/hooks/useBookmarks";
import { FolderOpen, HardDriveDownload, Trash2, Plus } from "lucide-react";

interface StorageSidebarProps {
  activeFolder: string | null;
  onSelectFolder: (folder: string) => void;
}

export const StorageSidebar = ({ activeFolder, onSelectFolder }: StorageSidebarProps) => {
  const { getFolders, bookmarks, createFolder, deleteFolder } = useBookmarks();
  const folders = getFolders();

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 group flex flex-col pl-4">
      <div className="w-12 group-hover:w-56 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl transition-all duration-300 overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-2">
        <div className="p-3 border-b border-white/10 flex items-center gap-3 w-56 text-white/80 overflow-hidden">
          <HardDriveDownload className="w-5 h-5 shrink-0" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Storage Arrays
          </span>
        </div>
        
        <div className="flex flex-col py-2 w-56">
          {folders.map(folder => {
             const count = bookmarks[folder]?.length || 0;
             const isSelected = activeFolder === folder;
             
             return (
               <button
                 key={folder}
                 onClick={() => onSelectFolder(folder)}
                 className={`flex items-center gap-3 px-3 py-3 w-full text-left text-sm font-medium tracking-wide transition-all hover:bg-white/10 hover:text-white ${isSelected ? "bg-primary/20 text-white border-r-2 border-primary" : "text-white/60"}`}
                 title={`${folder} (${count})`}
               >
                 <FolderOpen className={`w-5 h-5 shrink-0 ${isSelected ? "text-primary" : "text-white/50"}`} />
                 <div className="flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center whitespace-nowrap overflow-hidden pr-2">
                   <span className="truncate">{folder}</span>
                   <div className="flex items-center gap-1">
                     <span className="text-[10px] bg-background border border-border px-1.5 py-0.5 min-w-[1.5rem] text-center">{count}</span>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         const confirm = window.confirm(`DELETE DIRECTORY [${folder}] AND ALL ITS INTELLIGENCE?`);
                         if (confirm) deleteFolder(folder);
                       }}
                       className="p-1 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                       title="Delete Directory"
                     >
                       <Trash2 className="w-3 h-3" />
                     </button>
                   </div>
                 </div>
               </button>
             );
          })}
        </div>
        
        <div className="p-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-56">
          <button 
            onClick={() => {
              const name = window.prompt("ALLOCATE NEW DIRECTORY NAME:");
              if (name) createFolder(name);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-xs font-semibold tracking-wide text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
          >
            <Plus className="w-3 h-3" />
            CREATE DIRECTORY
          </button>
        </div>
      </div>
    </div>
  );
};
