const axios = require('axios');
const cheerio = require('cheerio');

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

async function analyzeTeamsPage() {
  try {
    const url = 'https://sofifa.com/teams?type=all&lg%5B%5D=4';
    
    const response = await axios.get(`http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`);
    
    const $ = cheerio.load(response.data);
    
    // Procurar pela tabela de times
    const rows = $('table tbody tr');
    
    console.log(`\n=== ANÁLISE DA PÁGINA DE TIMES ===\n`);
    console.log(`Total de linhas encontradas: ${rows.length}\n`);
    
    // Analisar primeira linha
    if (rows.length > 0) {
      const firstRow = rows.eq(0);
      console.log('=== PRIMEIRA LINHA (HTML) ===\n');
      console.log(firstRow.html());
      
      console.log('\n=== ANÁLISE DE CÉLULAS (TD) ===\n');
      const cells = firstRow.find('td');
      cells.each((i, cell) => {
        const $cell = $(cell);
        console.log(`\nTD[${i}]:`);
        console.log(`  Classe: ${$cell.attr('class')}`);
        console.log(`  Texto: ${$cell.text().trim().substring(0, 100)}`);
        console.log(`  HTML: ${$cell.html().substring(0, 200)}`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

analyzeTeamsPage();
