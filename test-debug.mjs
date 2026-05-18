import { load } from 'cheerio';

const apiKey = process.env.SCRAPER_API_KEY;
const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16&offset=0';

try {
  const response = await fetch(`http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`);
  const html = await response.text();
  
  const $ = load(html);
  
  const firstRow = $('tbody tr').first();
  const cells = firstRow.find('td');
  
  const $td1 = cells.eq(1);
  const nomeLink = $td1.find('a[href*="/player/"]').first();
  const nome = nomeLink.text().trim();
  
  console.log('TD[1] HTML:', $td1.html()?.substring(0, 300));
  console.log('\nNome Link:', nomeLink.html());
  console.log('Nome extraído:', nome);
  console.log('Nome é vazio?', nome === '');
  
  const td1Text = $td1.text().trim();
  console.log('\nTD[1] Texto completo:', td1Text);
  
} catch (error) {
  console.error('Erro:', error.message);
}
