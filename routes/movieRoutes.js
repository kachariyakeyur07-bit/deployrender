const express = require("express");

const {
    getMovies,
    getCategories,
    searchMovies,
    getMovieDetails,
    processDownloadLink,
    processCloudLink,
    processGenLink
} = require("../controllers/movieController");

const router = express.Router();

router.get("/", getMovies);
router.get("/page/:page", getMovies);
router.get("/categories", getCategories);
router.get("/category/*categoryPath", getMovies);
router.get("/search", searchMovies);

router.get("/details/:slug", getMovieDetails);

router.post("/process-link", processDownloadLink);
router.post("/process-link/cloud", processCloudLink);
router.post("/process-link/cloud/genlink", processGenLink);

module.exports = router;