const axios = require("axios");

const fetchPage = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: 15000,
            maxRedirects: 5,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml"
            }
        });

        return response.data;

    } catch (error) {
        throw new Error(
            `Failed to fetch website: ${error.message}`
        );
    }
};

module.exports = fetchPage;
