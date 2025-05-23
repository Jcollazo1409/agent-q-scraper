const express = require('express');
const puppeteer = require('puppeteer');
const stringSimilarity = require('string-similarity');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
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

    let partNumber = '';
    let matchedText = '';
    let score = 0;
    let matchedCategory = '';
    let matchedDiagram = '';

    for (const cat of categoryLinks) {
      await page.goto(cat.href, { waitUntil: 'domcontentloaded' });

      const subLinks = await page.$$eval('a', anchors =>
        anchors
          .filter(a => a.href.includes('showparts'))
          .map(a => ({ href: a.href, text: a.textContent.trim() }))
      );

      for (const sub of subLinks) {
        await page.goto(sub.href, { waitUntil: 'domcontentloaded' });

        const rows = await page.$$eval('table tr', trs =>
          trs.map(tr => {
            const tds = tr.querySelectorAll('td');
            return {
              desc: tds[1] ? tds[1].innerText.trim() : '',
              part: tds[5] ? tds[5].innerText.trim() : ''
            };
          })
        );

        const userDesc = normalize(pieza);
        for (const row of rows) {
          const descNorm = normalize(row.desc);
          const similarity = stringSimilarity.compareTwoStrings(userDesc, descNorm);
          if (similarity > 0.3 && similarity > score) {
            score = similarity;
            partNumber = row.part;
            matchedText = row.desc;
            matchedCategory = cat.alt || '';
            matchedDiagram = sub.text;
          }
        }

        if (partNumber) break;
      }

      if (partNumber) break;
    }

    await browser.close();

    return res.json({
      vin,
      pieza,
      matched_category: matchedCategory,
      matched_diagram: matchedDiagram,
      matched_description: matchedText,
      score,
      part_number: partNumber,
      source: 'RealOEM (v2.5)',
      success: partNumber !== ''
    });

  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('Agent Q v2.5 is running');
});

app.listen(PORT, () => {
  console.log(`Agent Q v2.5 running on port ${PORT}`);
});