const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/vin', (req, res) => {
  const { vin, pieza, marca } = req.body;

  console.log('Request received:', vin, pieza, marca);

  // Aquí se podría conectar scraping real, por ahora es placeholder
  const partNumber = `${marca?.slice(0, 3)?.toUpperCase() || 'GEN'}-123456`;

  res.json({
    vin,
    pieza,
    marca,
    part_number: partNumber,
    source: 'AgentQ'
  });
});

app.get('/', (req, res) => {
  res.send('Agent Q is live 🚗');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});