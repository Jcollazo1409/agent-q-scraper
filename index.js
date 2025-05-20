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

    const links = await page.$$eval('a', (elements) =>
      elements
        .filter(el => el.textContent.toLowerCase().includes('blower') || el.textContent.toLowerCase().includes('regulator'))
        .map(el => ({ href: el.href, text: el.textContent.trim() }))
    );

    let partNumbers = [];
    let matchPage = 'none';

    for (const link of links) {
      await page.goto(link.href, { waitUntil: 'domcontentloaded' });
      const content = await page.content().toLowerCase();
      if (content.includes(pieza.toLowerCase())) {
        const matches = content.match(/\b[0-9]{7}\b/g);
        if (matches) {
          partNumbers = [...new Set(matches)];
          matchPage = link.text;
          break;
        }
      }
    }

    await browser.close();

    return res.json({
      vin,
      pieza,
      category_found: matchPage,
      found_parts: partNumbers,
      source: 'RealOEM (v2.1)',
      success: partNumbers.length > 0
    });

  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('Agent Q v2.1 is running');
});

app.listen(PORT, () => {
  console.log(`Agent Q v2.1 running on port ${PORT}`);
});