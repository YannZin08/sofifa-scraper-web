import axios from 'axios';
import { load } from 'cheerio';

const url = 'https://api.scraperapi.com?api_key=8e6655aedf69b0dbf991faead8a59508&url=https://sofifa.com/players?type=all&lg%5B%5D=16&offset=0';

try {
  console.log('Fetching...');
  const response = await axios.get(url, { timeout: 45000 });
  const html = response.data;
  const $ = load(html);
  
  // Pegar primeira linha da tabela
  const firstRow = $('tbody tr').first();
  const $cells = firstRow.find('td');
  
  console.log('📊 Estrutura da primeira linha:\n');
  console.log(`Total de colunas: ${$cells.length}\n`);
  
  // TD[1] - Nome
  const $td1 = $cells.eq(1);
  console.log('TD[1] HTML (primeiros 500 chars):');
  console.log($td1.html()?.substring(0, 500));
  console.log('\nTD[1] Texto:');
  console.log($td1.text());
  
  // Verificar links
  console.log('\n\nLinks em TD[1]:');
  $td1.find('a').each((i, link) => {
    console.log(`Link ${i}: href="${$(link).attr('href')}", text="${$(link).text()}"`);
  });
  
} catch (error) {
  console.error('Erro:', error.message);
}
