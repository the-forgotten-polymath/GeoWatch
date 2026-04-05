import { useState, useEffect } from "react";
import { Article } from "@/types";

export type BookmarksData = Record<string, Article[]>;

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarksData>(() => {
    try {
      const saved = localStorage.getItem("geowatch_bookmarks_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) return parsed;
      }
      
      const old = localStorage.getItem("geowatch_bookmarks");
      if (old) {
        const parsed = JSON.parse(old);
        if (Array.isArray(parsed) && parsed.length > 0) return { "General": parsed };
      }
    } catch (e) {
      console.error("Failed to load bookmarks", e);
    }
    
    return { "General": [], "Geopolitics": [], "High Threat": [], "Economy": [] };
  });

  useEffect(() => {
    localStorage.setItem("geowatch_bookmarks_v2", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const saveBookmark = (article: Article, folder: string) => {
    setBookmarks((prev) => {
      const newState = { ...prev };
      if (!newState[folder]) newState[folder] = [];
      Object.keys(newState).forEach(f => {
        newState[f] = newState[f].filter(a => a.url !== article.url);
      });
      newState[folder] = [article, ...newState[folder]];
      return newState;
    });
  };

  const removeBookmark = (url: string) => {
    setBookmarks((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach(f => {
        newState[f] = newState[f].filter(a => a.url !== url);
      });
      return newState;
    });
  };

  const isBookmarked = (url: string): string | false => {
    for (const [folder, articles] of Object.entries(bookmarks)) {
      if (articles.some(a => a.url === url)) return folder;
    }
    return false;
  };

  const getFolders = () => Object.keys(bookmarks);

  const createFolder = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBookmarks(prev => {
      if (prev[trimmed]) return prev;
      return { ...prev, [trimmed]: [] };
    });
  };

  const deleteFolder = (name: string) => {
    setBookmarks(prev => {
      const newState = { ...prev };
      delete newState[name];
      if (Object.keys(newState).length === 0) newState["General"] = [];
      return newState;
    });
  };

  return { bookmarks, saveBookmark, removeBookmark, isBookmarked, getFolders, createFolder, deleteFolder };
}
