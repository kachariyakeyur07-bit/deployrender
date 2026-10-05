const cheerio = require("cheerio");
const fetchPage = require("../../utils/fetchPage");
const config = require("../../config/config");

const getMovieDetails = async (slug) => {
    if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
        throw new Error("Invalid movie slug");
    }

    const movieUrl = new URL(`/${slug}/`, config.WEBSITE_URL).href;
    const html = await fetchPage(movieUrl);
    const $ = cheerio.load(html);

    // Movie title
    const title = $(".page-title").first().text().trim();

    // Movie description
    const description =
        $('meta[name="description"]').attr("content")?.trim() || "";

    // Movie thumbnail (not screenshot images)
    let thumbnail =
        $('meta[property="og:image"]').attr("content") ||
        $(".page-body > p img").first().attr("src") ||
        "";

    if (thumbnail) {
        thumbnail = new URL(thumbnail, movieUrl).href;
    }

    // Only movie screenshots
    const screenshotHeading = $("h2").filter((_, element) =>
        $(element).text().toLowerCase().includes("screen-shots")
    ).first();

    const screenshots = [];

    if (screenshotHeading.length) {
        const screenshotContainer = screenshotHeading.nextAll("h3").first();

        screenshotContainer.find("img").each((_, element) => {
            const imageUrl = $(element).attr("src");

            if (imageUrl) {
                const fullImageUrl = new URL(imageUrl, movieUrl).href;

                if (!screenshots.includes(fullImageUrl)) {
                    screenshots.push(fullImageUrl);
                }
            }
        });
    }

    const downloadOptions = [];
    $("a").each((_, element) => {
        const href = $(element).attr("href");
        if (href && (
            href.includes("greenmotors.club") ||
            href.includes("hubdrive.pics")
        )) {
            let name = $(element).text().trim().replace(/\s+/g, " ");

            // Fallback for names if empty
            if (!name && href.includes("hubdrive")) name = "Download HubDrive";
            if (!name && href.includes("greenmotors")) name = "Download GreenMotors";

            if (name && !downloadOptions.some(opt => opt.url === href)) {
                downloadOptions.push({ name, url: href });
            }
        }
    });

    return {
        title,
        description,
        thumbnail,
        href: movieUrl,
        screenshots,
        downloadOptions,
    };
};

module.exports = getMovieDetails;