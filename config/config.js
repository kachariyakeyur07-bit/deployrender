const dotenv = require("dotenv");

dotenv.config();

const config = {
    PORT: process.env.PORT || 5000,
    WEBSITE_URL: process.env.WEBSITE_URL
        ? process.env.WEBSITE_URL.replace(/\/+$/, "")
        : null
};

if (!config.WEBSITE_URL) {
    throw new Error("WEBSITE_URL is missing in environment variables (or .env file)");
}

module.exports = config;
