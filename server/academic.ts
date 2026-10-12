/**
 * Academic Literature Search Services (arXiv & OpenAlex)
 */

export interface NormalizedAcademicPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  source: string;
  abstract: string;
  url: string;
  doi?: string;
  citationCount?: number;
}

/**
 * Search arXiv using official public Atom API
 */
export async function searchArxiv(query: string, maxResults: number = 5): Promise<NormalizedAcademicPaper[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `http://export.arxiv.org/api/query?search_query=all:${encoded}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ResearchLens-Academic-Intelligence/1.0',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.warn(`arXiv API returned status ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    // Parse entries from XML
    const entryMatches = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
    
    const papers: NormalizedAcademicPaper[] = [];
    for (const entry of entryMatches) {
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
      const doiMatch = entry.match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/);
      
      const authorMatches = [...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)];
      const authors = authorMatches.map(m => m[1].trim());

      const rawTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Untitled';
      const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';
      const paperUrl = idMatch ? idMatch[1].trim() : '';
      const publishedYear = publishedMatch ? new Date(publishedMatch[1].trim()).getFullYear() : 2024;

      papers.push({
        id: `arxiv-${paperUrl.split('/abs/')[1] || Math.random().toString(36).substring(7)}`,
        title: rawTitle,
        authors: authors.length > 0 ? authors : ['Unknown Researchers'],
        year: publishedYear,
        source: 'arXiv.org',
        abstract: abstract.slice(0, 500) + (abstract.length > 500 ? '...' : ''),
        url: paperUrl,
        doi: doiMatch ? doiMatch[1].trim() : undefined,
      });
    }

    return papers;
  } catch (err) {
    console.warn('arXiv search failed or timed out:', err);
    return [];
  }
}

/**
 * Search OpenAlex public API
 */
export async function searchOpenAlex(query: string, maxResults: number = 5): Promise<NormalizedAcademicPaper[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.openalex.org/works?search=${encoded}&per-page=${maxResults}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'mailto:pal900290@gmail.com ResearchLens',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.warn(`OpenAlex returned status ${response.status}`);
      return [];
    }

    const data: any = await response.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((work: any) => {
      const authors = (work.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean);
      
      // Invert inverted abstract index if present
      let abstract = '';
      if (work.abstract_inverted_index) {
        const words: { word: string; pos: number }[] = [];
        for (const [word, positions] of Object.entries(work.abstract_inverted_index as Record<string, number[]>)) {
          for (const pos of positions) {
            words.push({ word, pos });
          }
        }
        words.sort((a, b) => a.pos - b.pos);
        abstract = words.map(w => w.word).join(' ');
      }

      return {
        id: `openalex-${work.id?.split('/').pop() || Math.random().toString(36).substring(7)}`,
        title: work.display_name || work.title || 'Untitled Academic Work',
        authors: authors.length > 0 ? authors.slice(0, 4) : ['Academic Authors'],
        year: work.publication_year || 2023,
        source: work.primary_location?.source?.display_name || 'OpenAlex Index',
        abstract: abstract.slice(0, 500) + (abstract.length > 500 ? '...' : ''),
        url: work.doi || work.landing_page_url || work.id,
        doi: work.doi ? work.doi.replace('https://doi.org/', '') : undefined,
        citationCount: work.cited_by_count,
      };
    });
  } catch (err) {
    console.warn('OpenAlex search failed or timed out:', err);
    return [];
  }
}

/**
 * Unified literature search combining arXiv and OpenAlex
 */
export async function searchLiterature(query: string, maxResults: number = 8): Promise<NormalizedAcademicPaper[]> {
  try {
    const [arxivResults, openAlexResults] = await Promise.allSettled([
      searchArxiv(query, Math.ceil(maxResults / 2)),
      searchOpenAlex(query, Math.ceil(maxResults / 2)),
    ]);

    const papers: NormalizedAcademicPaper[] = [];
    if (arxivResults.status === 'fulfilled') {
      papers.push(...arxivResults.value);
    }
    if (openAlexResults.status === 'fulfilled') {
      papers.push(...openAlexResults.value);
    }

    // Deduplicate by title similarity
    const unique: NormalizedAcademicPaper[] = [];
    const seenTitles = new Set<string>();

    for (const p of papers) {
      const normalizedTitle = p.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        unique.push(p);
      }
    }

    return unique.slice(0, maxResults);
  } catch (err) {
    console.error('Error combining literature results:', err);
    return [];
  }
}
