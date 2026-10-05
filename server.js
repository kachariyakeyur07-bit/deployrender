const app = require("./app");
const { PORT } = require("./config/config");

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
