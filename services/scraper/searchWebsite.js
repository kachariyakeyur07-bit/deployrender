const axios = require("axios");
const cheerio = require("cheerio");
const fetchPage = require("../../utils/fetchPage");
const { WEBSITE_URL } = require("../../config/config");

/**
 * Scrapes and executes search via target website's search.html endpoint
 * @param {string} query - The search query term
 * @param {number|string} pageNumber - Page number to fetch (defaults to 1)
 */
const searchWebsite = async (query, pageNumber = 1) => {
    const trimmedQuery = (query || "").trim();
    if (!trimmedQuery) {
        return {
            movies: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                hasPrev: false,
                hasNext: false,
                items: []
            },
            count: 0,
            total: 0,
            query: ""
        };
    }

    const page = Math.max(1, parseInt(pageNumber, 10) || 1);
    const searchPageUrl = `${WEBSITE_URL}/search.html?q=${encodeURIComponent(trimmedQuery)}`;

    // 1. Fetch website's search.html page
    let proxyUrl = "https://search.pingora.fyi/collections/post/documents/search";
    let staticMovies = [];

    try {
        const html = await fetchPage(searchPageUrl);

        // Try extracting proxyUrl from search.html scripts
        const proxyMatch = html.match(/proxyUrl:\s*["']([^"']+)["']/);
        if (proxyMatch && proxyMatch[1]) {
            proxyUrl = proxyMatch[1];
        }

        // Check if search.html rendered static movie items (fallback)
        const $ = cheerio.load(html);
        $("ul.recent-movies li.thumb, ul.movie-grid li.movie-card").each((_, element) => {
            const el = $(element);
            const image = el.find("figure img, .poster-wrapper img").first();
            const title = image.attr("alt") || el.find("figcaption p, .movie-title").text().trim();
            const thumbnail = image.attr("src");
            const href = el.find("a").first().attr("href");

            if (title && thumbnail && href) {
                staticMovies.push({
                    title: title.trim(),
                    thumbnail: thumbnail.trim(),
                    href: href.trim()
                });
            }
        });
    } catch (err) {
        console.warn(`[searchWebsite] Warning fetching search.html: ${err.message}. Using proxy fallback.`);
    }

    // 2. Fetch search results from the search API endpoint
    try {
        const today = new Date().toISOString().split("T")[0];
        const apiUrl = new URL(proxyUrl);
        apiUrl.searchParams.append("q", trimmedQuery);
        apiUrl.searchParams.append("query_by", "post_title,category,stars,director,imdb_id");
        apiUrl.searchParams.append("query_by_weights", "4,2,2,2,4");
        apiUrl.searchParams.append("sort_by", "sort_by_date:desc");
        apiUrl.searchParams.append("limit", "15");
        apiUrl.searchParams.append("highlight_fields", "none");
        apiUrl.searchParams.append("use_cache", "true");
        apiUrl.searchParams.append("page", String(page));
        apiUrl.searchParams.append("analytics_tag", today);

        const response = await axios.get(apiUrl.toString(), {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": `${WEBSITE_URL}/`,
                "Origin": `${WEBSITE_URL}`,
                "Accept": "application/json, text/plain, */*"
            },
            timeout: 12000
        });

        const data = response.data || {};
        const totalHits = data.found || 0;
        const totalPages = Math.max(1, Math.ceil(totalHits / 15));

        const movies = (data.hits || []).map((hit) => {
            const doc = hit.document || {};
            let pathname = "";
            try {
                pathname = new URL(doc.permalink, WEBSITE_URL).pathname;
            } catch {
                pathname = doc.permalink || "";
            }

            return {
                title: doc.post_title || "Untitled",
                thumbnail: doc.post_thumbnail || "",
                href: pathname
            };
        });

        // Build pagination items matching main catalog structure
        const items = [];
        if (page > 1) {
            items.push({
                type: "prev",
                page: page - 1,
                label: "Previous"
            });
        }

        let rangeStart = Math.max(1, page - 2);
        let rangeEnd = Math.min(totalPages, page + 2);

        if (rangeStart > 1) {
            items.push({
                type: "page",
                page: 1,
                isCurrent: page === 1,
                label: "1"
            });
            if (rangeStart > 2) {
                items.push({ type: "dots", label: "…" });
            }
        }

        for (let i = rangeStart; i <= rangeEnd; i++) {
            items.push({
                type: "page",
                page: i,
                isCurrent: i === page,
                label: String(i)
            });
        }

        if (rangeEnd < totalPages) {
            if (rangeEnd < totalPages - 1) {
                items.push({ type: "dots", label: "…" });
            }
            items.push({
                type: "page",
                page: totalPages,
                isCurrent: page === totalPages,
                label: String(totalPages)
            });
        }

        if (page < totalPages) {
            items.push({
                type: "next",
                page: page + 1,
                label: "Next"
            });
        }

        return {
            movies: movies.length > 0 ? movies : staticMovies,
            pagination: {
                currentPage: page,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page < totalPages ? page + 1 : null,
                items
            },
            count: movies.length > 0 ? movies.length : staticMovies.length,
            total: totalHits,
            query: trimmedQuery,
            currentPage: page
        };
    } catch (apiErr) {
        console.error(`[searchWebsite] Error calling search API: ${apiErr.message}`);

        // If static movies were found, return them
        if (staticMovies.length > 0) {
            return {
                movies: staticMovies,
                pagination: {
                    currentPage: page,
                    totalPages: 1,
                    hasPrev: false,
                    hasNext: false,
                    items: [{ type: "page", page: 1, isCurrent: true, label: "1" }]
                },
                count: staticMovies.length,
                total: staticMovies.length,
                query: trimmedQuery
            };
        }

        throw new Error(`Search failed: ${apiErr.message}`);
    }
};

module.exports = searchWebsite;
