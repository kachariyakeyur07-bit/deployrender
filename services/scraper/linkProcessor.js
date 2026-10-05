const axios = require('axios');
const cheerio = require('cheerio');

const processDownloadLink = async (url) => {
    if (!url) {
        throw new Error("URL is required");
    }

    // Type 1: hubdrive.pics, hubcdn.club (Direct file paths)
    if (url.includes("hubdrive.pics") || url.includes("hubcdn.club")) {
        console.log("Processing Type 1 Link:", url);
        
        try {
            // Step 1: Fetch the HTML of the provided Type 1 URL
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);
            
            // Step 2: Find the link that contains 'https://hubcloud.ist/drive/'
            let hubCloudLink = null;
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && href.includes('https://hubcloud.ist/drive/')) {
                    hubCloudLink = href;
                }
            });

            if (!hubCloudLink) {
                return {
                    success: false,
                    message: "HubCloud link not found in the page."
                };
            }

            // Step 3: Send the extracted link to the frontend
            return {
                success: true,
                type: "type1",
                hubCloudLink: hubCloudLink,
                message: "Type 1 link identified and HubCloud link extracted."
            };
        } catch (error) {
            console.error("Error processing Type 1 link:", error.message);
            throw new Error("Failed to process Type 1 link");
        }
    } 
    // Type 2: greenmotors.club (Base64 ID query param)
    else if (url.includes("greenmotors.club")) {
        console.log("Processing Type 2 Link:", url);
        
        // TODO: User will provide the logic for Type 2
        
        return {
            success: true,
            type: "type2",
            message: "Type 2 link identified. Ready for next steps."
        };
    } 
    // Unsupported link type
    else {
        throw new Error("Unsupported link type");
    }
};

const processCloudLink = async (url) => {
    if (!url) {
        throw new Error("Cloud URL is required");
    }

    console.log("Processing Cloud Link:", url);

    try {
        // Step 1: Fetch the HTML of the cloud link
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Step 2: Find the gamerxyt.com link
        let genLink = null;
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('https://gamerxyt.com/hubcloud.php?host=hubcloud&id=')) {
                genLink = href;
            }
        });

        if (!genLink) {
            return {
                success: false,
                message: "Generator link (gamerxyt.com) not found in the page."
            };
        }

        // Step 3: Send it to the frontend
        return {
            success: true,
            type: "genlink",
            genLink: genLink,
            message: "Cloud link processed and Generator link extracted."
        };
    } catch (error) {
        console.error("Error processing cloud link:", error.message);
        throw new Error("Failed to process cloud link");
    }
};

const processGenLink = async (url) => {
    if (!url) {
        throw new Error("Generator URL is required");
    }

    console.log("Processing Generator Link:", url);

    try {
        // Step 1: Fetch the HTML of the generator link
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        let finalDownloadLink = null;
        let serverType = null;
        
        // Step 2: First try to find the "FSLv2 Server" element (id="s3")
        const fslv2Element = $('#s3');
        if (fslv2Element.length > 0) {
            finalDownloadLink = fslv2Element.attr('href');
            serverType = "FSLv2 Server";
        } else {
            // Fallback: search all links by text for FSLv2
            $('a').each((i, el) => {
                const text = $(el).text();
                if (text.includes("FSLv2 Server") && !finalDownloadLink) {
                    finalDownloadLink = $(el).attr('href');
                    serverType = "FSLv2 Server";
                }
            });
        }

        // Step 3: If FSLv2 is not found, try to find the "FSL Server" element (id="fsl")
        if (!finalDownloadLink) {
            const fslElement = $('#fsl');
            if (fslElement.length > 0) {
                finalDownloadLink = fslElement.attr('href');
                serverType = "FSL Server";
            } else {
                // Fallback: search all links by text for FSL
                $('a').each((i, el) => {
                    const text = $(el).text();
                    if (text.includes("FSL Server") && !finalDownloadLink) {
                        finalDownloadLink = $(el).attr('href');
                        serverType = "FSL Server";
                    }
                });
            }
        }

        // Step 4: Fallback to any other download server if FSL/FSLv2 is unavailable
        if (!finalDownloadLink) {
            $('a').each((i, el) => {
                const text = $(el).text().trim();
                const href = $(el).attr('href');
                if (href && (text.includes("Download [Server") || text.includes("PixelServer") || text.includes("Download [") || href.includes("gpdl.hubcloud") || href.includes("pixeldrain"))) {
                    if (!finalDownloadLink) {
                        finalDownloadLink = href;
                        serverType = text.replace(/^Download\s*\[?/, '').replace(/\]?$/, '').trim() || "Cloud Server";
                    }
                }
            });
        }

        if (!finalDownloadLink) {
            return {
                success: false,
                message: "Final download link not found in the page."
            };
        }

        // Step 4: Send the final link to the frontend
        return {
            success: true,
            type: "finallink",
            finalLink: finalDownloadLink,
            serverName: serverType,
            message: `Generator link processed and Final download link (${serverType}) extracted.`
        };
    } catch (error) {
        console.error("Error processing generator link:", error.message);
        throw new Error("Failed to process generator link");
    }
};

module.exports = {
    processDownloadLink,
    processCloudLink,
    processGenLink
};
