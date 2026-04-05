import { fetchGlobalRelationalNews } from "./src/services/newsService";
import { globalRelations } from "./src/data/relationships";

(async () => {
  try {
    const newsEdges = await fetchGlobalRelationalNews();
    console.log("TOTAL RAW EDGES:", newsEdges.length);
    let mapped = 0;
    for (const rel of globalRelations) {
      const match = newsEdges.filter(
        ne => (ne.source === rel.source && ne.target === rel.target) || (ne.source === rel.target && ne.target === rel.source)
      );
      if (match.length > 0) {
        console.log(`FOUND EDGE FOR: ${rel.source} - ${rel.target} (${match.length} articles)`);
        mapped++;
      }
    }
    console.log("MAPPED TO RELATIONS MAP:", mapped);
  } catch (error) {
    console.error("Error:", error);
  }
})();
