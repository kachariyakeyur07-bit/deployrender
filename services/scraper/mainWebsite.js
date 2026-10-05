const cheerio = require("cheerio");
const fetchPage = require("../../utils/fetchPage");
const { WEBSITE_URL } = require("../../config/config");

/**
 * Extracts structured pagination from .pagination-wrap in HTML
 */
const extractPagination = ($, fallbackPage = 1) => {
    const paginationWrap = $(".pagination-wrap");
    if (!paginationWrap.length) {
        return {
            currentPage: fallbackPage,
            totalPages: fallbackPage,
            hasPrev: fallbackPage > 1,
            hasNext: false,
            prevPage: fallbackPage > 1 ? fallbackPage - 1 : null,
            nextPage: null,
            items: [{ type: "page", page: fallbackPage, isCurrent: true, label: String(fallbackPage) }]
        };
    }

    const items = [];
    let currentPage = fallbackPage;
    let totalPages = fallbackPage;
    let prevPage = null;
    let nextPage = null;

    paginationWrap.find("ul.pagination li").each((_, element) => {
        const li = $(element);
        const spanCurrent = li.find("span.current");
        const spanDots = li.find("span.dots");
        const aPrev = li.find("a.prev");
        const aNext = li.find("a.next");
        const aPage = li.find("a.page-numbers").not(".prev").not(".next");

        if (spanCurrent.length) {
            const pageNum = parseInt(spanCurrent.text().trim(), 10) || currentPage;
            currentPage = pageNum;
            if (pageNum > totalPages) totalPages = pageNum;
            items.push({
                type: "page",
                page: pageNum,
                href: `/page/${pageNum}/`,
                isCurrent: true,
                label: String(pageNum)
            });
        } else if (spanDots.length) {
            items.push({
                type: "dots",
                label: "…"
            });
        } else if (aPrev.length) {
            const href = aPrev.attr("href") || "";
            const match = href.match(/\/page\/(\d+)\//);
            const pageNum = match ? parseInt(match[1], 10) : (currentPage > 1 ? currentPage - 1 : 1);
            prevPage = pageNum;
            items.push({
                type: "prev",
                page: pageNum,
                href: href || `/page/${pageNum}/`,
                label: "Previous"
            });
        } else if (aNext.length) {
            const href = aNext.attr("href") || "";
            const match = href.match(/\/page\/(\d+)\//);
            const pageNum = match ? parseInt(match[1], 10) : currentPage + 1;
            nextPage = pageNum;
            items.push({
                type: "next",
                page: pageNum,
                href: href || `/page/${pageNum}/`,
                label: "Next"
            });
        } else if (aPage.length) {
            const href = aPage.attr("href") || "";
            const match = href.match(/\/page\/(\d+)\//);
            const pageNum = match ? parseInt(match[1], 10) : (parseInt(aPage.text().trim(), 10) || 1);
            if (pageNum > totalPages) totalPages = pageNum;
            items.push({
                type: "page",
                page: pageNum,
                href: href || `/page/${pageNum}/`,
                isCurrent: false,
                label: String(pageNum)
            });
        }
    });

    return {
        currentPage,
        totalPages,
        hasPrev: prevPage !== null || currentPage > 1,
        hasNext: nextPage !== null || currentPage < totalPages,
        prevPage: prevPage || (currentPage > 1 ? currentPage - 1 : null),
        nextPage: nextPage || (currentPage < totalPages ? currentPage + 1 : null),
        items
    };
};

/**
 * Extracts categories navigation links and dropdowns from nav.category-navbar
 */
const extractCategories = ($) => {
    const nav = $("nav.category-navbar");
    if (!nav.length) {
        return null;
    }

    const categories = [];

    nav.find("ul#category-links > li").each((_, element) => {
        const li = $(element);
        if (li.attr("id") === "mobile-search") return;

        const isDropdown = li.hasClass("dropdown");
        const topLink = li.find("> a");
        const title = topLink.text().replace(/[▾\s]+/g, " ").trim();
        const href = topLink.attr("href");

        if (isDropdown) {
            const subItems = [];
            li.find("ul.dropdown-menu li a").each((_, subEl) => {
                const subTitle = $(subEl).text().replace(/[\u00a0\s]+/g, " ").trim();
                const subHref = $(subEl).attr("href");
                if (subTitle && subHref) {
                    subItems.push({
                        title: subTitle,
                        href: subHref
                    });
                }
            });

            if (subItems.length) {
                const dropdownId = li.attr("id") || (title.toLowerCase().includes("genre") ? "genres-dropdown" : "more-dropdown");
                categories.push({
                    type: "dropdown",
                    id: dropdownId,
                    title: title || (dropdownId === "genres-dropdown" ? "GENREs" : "More"),
                    items: subItems
                });
            }
        } else if (href && title) {
            // Do NOT include external 4khdhub.one or external domains
            if (href.includes("4khdhub") || href.startsWith("http")) return;

            let cleanTitle = title.replace(/HDHub4u\s*/i, "").replace(/🏠/g, "").trim();
            if (!cleanTitle || href === "/") cleanTitle = "Home";

            categories.push({
                type: "link",
                title: cleanTitle,
                href: href
            });
        }
    });

    return categories.length > 0 ? categories : null;
};

const getMovies = async (pageNumber = 1, categoryPath = "") => {
    const page = Math.max(1, parseInt(pageNumber, 10) || 1);

    const cleanPath = categoryPath
        ? categoryPath.replace(/^\/+|\/+$/g, "")
        : "";

    let targetUrl = WEBSITE_URL;
    if (cleanPath) {
        targetUrl = page > 1 
            ? `${WEBSITE_URL}/${cleanPath}/page/${page}/` 
            : `${WEBSITE_URL}/${cleanPath}/`;
    } else {
        targetUrl = page > 1 
            ? `${WEBSITE_URL}/page/${page}/` 
            : `${WEBSITE_URL}/`;
    }

    const html = await fetchPage(targetUrl);

    const $ = cheerio.load(html);

    const movies = [];

    const movieSection = $(
        "section.home-wrapper.thumbnail-wrapper.left-wrapper.col-md-8"
    );

    movieSection.find("ul.recent-movies li.thumb").each((index, element) => {
        const movie = $(element);

        const image = movie.find("figure img").first();

        const title = image.attr("alt") ||
                      movie.find("figcaption p").text().trim();

        const thumbnail = image.attr("src");

        const href = movie.find("figure a").first().attr("href");

        if (title && thumbnail && href) {
            movies.push({
                title: title.trim(),
                thumbnail: thumbnail.trim(),
                href: href.trim()
            });
        }
    });

    const pagination = extractPagination($, page);
    const categories = extractCategories($);

    return {
        movies,
        pagination,
        categories,
        currentPage: page,
        categoryPath: cleanPath ? `/${cleanPath}/` : "/"
    };
};

module.exports = getMovies;
