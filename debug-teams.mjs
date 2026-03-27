import axios from 'axios';
import * as cheerio from 'cheerio';

const scraperApiKey = process.env.SCRAPER_API_KEY;
const targetUrl = 'https://sofifa.com/teams?type=all&lg%5B0%5D=13&lg%5B1%5D=31&lg%5B2%5D=53&lg%5B3%5D=19&lg%5B4%5D=16&lg%5B5%5D=14&lg%5B6%5D=60&lg%5B7%5D=61&lg%5B8%5D=20&lg%5B9%5D=54&lg%5B10%5D=2076&lg%5B11%5D=10&lg%5B12%5D=308&lg%5B13%5D=4&lg%5B14%5D=50&lg%5B15%5D=353&lg%5B16%5D=350&lg%5B17%5D=39&lg%5B18%5D=68&offset=0';

try {
  const response = await axios.get(`http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`);
  const $ = cheerio.load(response.data);
  
  const rows = $('table tbody tr');
  console.log(`Total de linhas encontradas: ${rows.length}`);
  
  if (rows.length > 0) {
    const firstRow = rows.first();
    const cells = firstRow.find('td');
    console.log(`\nTotal de colunas na primeira linha: ${cells.length}`);
    
    cells.each((index, cell) => {
      const $cell = $(cell);
      const text = $cell.text().trim().substring(0, 80);
      console.log(`TD[${index}]: ${text}`);
    });
    
    console.log('\n=== IMAGENS ===');
    const images = firstRow.find('img');
    images.each((index, img) => {
      const $img = $(img);
      console.log(`Imagem ${index}: src=${$img.attr('src')} data-src=${$img.attr('data-src')}`);
    });
  }
} catch (error) {
  console.error('Erro:', error.message);
}
