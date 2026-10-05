const express = require("express");
const cors = require("cors");

const movieRoutes = require("./routes/movieRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", movieRoutes);
app.use("/api", movieRoutes);

app.use(errorHandler);

module.exports = app;
