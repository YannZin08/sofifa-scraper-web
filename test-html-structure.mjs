import { load } from 'cheerio';

const apiKey = process.env.SCRAPER_API_KEY;
const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16&offset=0';

console.log('Buscando HTML com ScraperAPI...');

try {
  const response = await fetch(`http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`);
  const html = await response.text();
  
  const $ = load(html);
  
  console.log('Analisando estrutura HTML...\n');
  
  // Pegar primeira linha
  const firstRow = $('tbody tr').first();
  const cells = firstRow.find('td');
  
  console.log(`Total de colunas: ${cells.length}`);
  console.log('\nConteúdo das primeiras 8 colunas:');
  
  for (let i = 0; i < Math.min(8, cells.length); i++) {
    const cell = cells.eq(i);
    const text = cell.text().trim().substring(0, 100);
    const html = cell.html()?.substring(0, 200) || '';
    console.log(`\nColuna ${i}:`);
    console.log(`  Texto: ${text}`);
    console.log(`  HTML: ${html}`);
  }
} catch (error) {
  console.error('Erro:', error.message);
}
