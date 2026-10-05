const getMoviesService = require("../services/scraper/mainWebsite");
const searchWebsiteService = require("../services/scraper/searchWebsite");
const getMovieDetailsService = require("../services/scraper/movieDetails");
const { 
    processDownloadLink: processLinkService, 
    processCloudLink: processCloudLinkService,
    processGenLink: processGenLinkService 
} = require("../services/scraper/linkProcessor");

const getMovies = async (req, res, next) => {
    try {
        const page = req.query.page || req.params.page || 1;
        let categoryPath = req.query.category || req.query.path || "";

        if (!categoryPath && (req.params.categoryPath !== undefined || req.params[0] !== undefined)) {
            const rawParam = req.params.categoryPath !== undefined ? req.params.categoryPath : req.params[0];
            const paramStr = Array.isArray(rawParam) ? rawParam.filter(Boolean).join("/") : String(rawParam || "");
            const clean = paramStr.replace(/^\/+|\/+$/g, "");
            if (clean) {
                categoryPath = clean.startsWith("category/") ? `/${clean}` : `/category/${clean}`;
            }
        }

        const result = await getMoviesService(page, categoryPath);

        res.status(200).json({
            success: true,
            count: result.movies.length,
            movies: result.movies,
            pagination: result.pagination,
            categories: result.categories,
            currentPage: result.currentPage,
            categoryPath: result.categoryPath
        });

    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const result = await getMoviesService(1, "");
        res.status(200).json({
            success: true,
            categories: result.categories
        });
    } catch (error) {
        next(error);
    }
};

const searchMovies = async (req, res, next) => {
    try {
        const query = req.query.q || req.query.search || "";
        const page = req.query.page || req.params.page || 1;

        if (!query.trim()) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const result = await searchWebsiteService(query, page);

        res.status(200).json({
            success: true,
            query: result.query,
            count: result.count,
            total: result.total,
            movies: result.movies,
            pagination: result.pagination,
            currentPage: result.currentPage
        });

    } catch (error) {
        next(error);
    }
};

const getMovieDetails = async (req, res, next) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Movie slug is required"
            });
        }

        const movie = await getMovieDetailsService(slug);

        res.status(200).json({
            success: true,
            movie
        });

    } catch (error) {
        next(error);
    }
};

const processDownloadLink = async (req, res, next) => {
    try {
        const { link } = req.body;

        if (!link) {
            return res.status(400).json({
                success: false,
                message: "Download link is required"
            });
        }

        const result = await processLinkService(link);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const processCloudLink = async (req, res, next) => {
    try {
        const { link } = req.body;

        if (!link) {
            return res.status(400).json({
                success: false,
                message: "Cloud link is required"
            });
        }

        const result = await processCloudLinkService(link);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const processGenLink = async (req, res, next) => {
    try {
        const { link } = req.body;

        if (!link) {
            return res.status(400).json({
                success: false,
                message: "Generator link is required"
            });
        }

        const result = await processGenLinkService(link);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMovies,
    getCategories,
    searchMovies,
    getMovieDetails,
    processDownloadLink,
    processCloudLink,
    processGenLink
};
