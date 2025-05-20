const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Agent Q is live");
});

app.post("/buscar-numero", (req, res) => {
    const { vin, marca, pieza } = req.body;
    const fakePartNumber = `FAKE-${marca}-${pieza}-123`;
    res.json({
        vin,
        marca,
        pieza,
        numeroParte: fakePartNumber
    });
});

app.listen(port, () => {
    console.log(`Agent Q running on port ${port}`);
});
