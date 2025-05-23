const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/gi, '');
}

function isFuzzyMatch(target, rowText) {
  const words = normalize(target).split(/\s+/);
  const haystack = normalize(rowText);
  return words.some(word => haystack.includes(word));
}

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

    const categoryLinks = await page.$$eval('map area', areas =>
      areas.map(a => ({
        href: a.href,
        alt: a.alt
      }))
    );

    let partNumbers = [];
    let matchedCategory = '';
    let matchedRow = '';
    let matchedDiagram = '';

    for (const link of categoryLinks) {
      await page.goto(link.href, { waitUntil: 'domcontentloaded' });

      const subLinks = await page.$$eval('a', anchors =>
        anchors
          .filter(a => a.href.includes('showparts'))
          .map(a => ({ href: a.href, text: a.textContent.trim() }))
      );

      for (const sub of subLinks) {
        await page.goto(sub.href, { waitUntil: 'domcontentloaded' });

        const rows = await page.$$eval('table tr', trs =>
          trs.map(tr => tr.innerText)
        );

        for (const row of rows) {
          if (isFuzzyMatch(pieza, row)) {
            matchedRow = row;
            matchedDiagram = sub.text;
            const matches = row.match(/\b[0-9]{7}\b/g);
            if (matches) {
              partNumbers = [...new Set(matches)];
              matchedCategory = link.alt || link.href;
              break;
            }
          }
        }

        if (partNumbers.length > 0) break;
      }

      if (partNumbers.length > 0) break;
    }

    await browser.close();

    return res.json({
      vin,
      pieza,
      matched_category: matchedCategory,
      matched_diagram: matchedDiagram,
      matched_row: matchedRow,
      found_parts: partNumbers,
      source: 'RealOEM (v2.4)',
      success: partNumbers.length > 0
    });

  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('Agent Q v2.4 is running');
});

app.listen(PORT, () => {
  console.log(`Agent Q v2.4 running on port ${PORT}`);
});