const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/vin', async (req, res) => {
  const { vin, pieza } = req.body;

  if (!vin || !pieza) {
    return res.status(400).json({ error: 'VIN y pieza son requeridos' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.realoem.com/bmw/enUS/select', { waitUntil: 'domcontentloaded' });
    await page.type('#vin', vin);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    ]);

    const html = await page.content();
    const lowerHTML = html.toLowerCase();
    const partMatch = lowerHTML.match(/\b[0-9]{7}\b/g);

    await browser.close();

    return res.json({
      vin,
      pieza,
      found_parts: partMatch ? [...new Set(partMatch)] : [],
      source: 'RealOEM',
      success: partMatch !== null
    });

  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('Agent Q (RealOEM BMW Scraper) is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});