const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Agent Q 3 v2.5 está activo");
});

app.post("/get-part-number", async (req, res) => {
  const { vin, marca, pieza } = req.body;

  if (!vin || !marca || !pieza) {
    return res.status(400).json({ status: "error", message: "Missing required fields." });
  }

  if (marca.toLowerCase() !== "bmw") {
    return res.status(400).json({ status: "error", message: "Only BMW supported in v2.5." });
  }

  // Simulación de respuesta basada en match parcial
  console.log(`[Agent Q] Recibido: VIN=${vin}, PIEZA=${pieza}`);

  const simulatedResponse = {
    part_number: "64119227670",
    match_confidence: 0.91,
    source: "AgentQ v2.5"
  };

  return res.status(200).json(simulatedResponse);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Agent Q 3 v2.5 corriendo en puerto ${PORT}`);
});
