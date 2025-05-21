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

    const keywords = pieza.toLowerCase().split(/\s|\\n|\n/).filter(word => word.length > 2);
    const links = await page.$$eval('a', (elements) =>
      elements
        .filter(el => el.textContent.toLowerCase().match(/blower|regulator|climate|heater|ac|hvac|air/i))
        .map(el => ({ href: el.href, text: el.textContent.trim() }))
    );

    let partNumbers = [];
    let matchedLink = 'none';
    let matchedLine = '';

    for (const link of links) {
      await page.goto(link.href, { waitUntil: 'domcontentloaded' });
      const rows = await page.$$eval('table tr', trs =>
        trs.map(tr => tr.innerText.toLowerCase().trim())
      );

      for (const row of rows) {
        if (keywords.some(word => row.includes(word))) {
          matchedLine = row;
          const matches = row.match(/\b[0-9]{7}\b/g);
          if (matches) {
            partNumbers = [...new Set(matches)];
            matchedLink = link.text;
            break;
          }
        }
      }

      if (partNumbers.length > 0) break;
    }

    await browser.close();

    return res.json({
      vin,
      pieza,
      matched_category: matchedLink,
      matched_row: matchedLine,
      found_parts: partNumbers,
      source: 'RealOEM (v2.2)',
      success: partNumbers.length > 0
    });

  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('Agent Q v2.2 is running');
});

app.listen(PORT, () => {
  console.log(`Agent Q v2.2 running on port ${PORT}`);
});