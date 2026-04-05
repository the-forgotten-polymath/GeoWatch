export interface Article {
  title: string;
  source: { name: string };
  publishedAt: string;
  urlToImage: string | null;
  url: string;
  description?: string;
  content?: string;
  allSources?: { name: string; url: string }[];
}
