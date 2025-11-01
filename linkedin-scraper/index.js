const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const Papa = require('papaparse');

const COOKIES_PATH = path.join(__dirname, 'cookies.json');
const INPUT_CSV = path.join(__dirname, 'profiles.csv');
const OUTPUT_CSV = path.join(__dirname, 'output.csv');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function saveResults(results) {
  const csv = Papa.unparse(results);
  fs.writeFileSync(OUTPUT_CSV, csv);
  console.log('✅ Resultados salvos em', OUTPUT_CSV);
}

async function saveCookies(page) {
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log('🍪 Cookies salvos!');
}

async function extractProfileData(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const data = await page.evaluate(() => {
      const out = {};
      const nameEl = document.querySelector('h1');
      const headlineEl = document.querySelector('.pv-text-details__left-panel .text-body-medium');
      const locationEl = document.querySelector('.pv-top-card--list-bullet li');
      out.name = nameEl ? nameEl.innerText.trim() : '';
      out.headline = headlineEl ? headlineEl.innerText.trim() : '';
      out.location = locationEl ? locationEl.innerText.trim() : '';
      return out;
    });

    return { url, ...data };
  } catch (e) {
    console.error('Erro no perfil:', url, e.message);
    return { url, error: e.message };
  }
}

async function main() {
  const csvText = fs.readFileSync(INPUT_CSV, 'utf8');
  const parsed = Papa.parse(csvText, { header: true });
  const urls = parsed.data.map((r) => r.url).filter(Boolean);

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const results = [];

  for (const url of urls) {
    console.log('🔍 Acessando:', url);
    const info = await extractProfileData(page, url);
    results.push(info);
    await sleep(5000 + Math.random() * 4000); // pausa entre 5–9s
  }

  await saveResults(results);
  await browser.close();
}

main().catch((err) => console.error(err));
