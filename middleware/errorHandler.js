const errorHandler = (err, req, res, next) => {

    console.error("Backend Error:", err.message);

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development"
            ? err.message
            : undefined
    });
};

module.exports = errorHandler;
