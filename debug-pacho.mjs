import axios from 'axios';
import { load } from 'cheerio';

const url = 'https://api.scraperapi.com?api_key=8e6655aedf69b0dbf991faead8a59508&url=https://sofifa.com/players?type=all&lg%5B%5D=16&offset=320';

try {
  console.log('Fetching Pacho...');
  const response = await axios.get(url, { timeout: 45000 });
  const html = response.data;
  const $ = load(html);
  
  // Procurar por Pacho
  let found = false;
  $('tbody tr').each((idx, row) => {
    const $row = $(row);
    const $cells = $row.find('td');
    const $td1 = $cells.eq(1);
    const nome = $td1.find('a[href*="/player/"]').first().text().trim();
    
    if (nome.includes('Pacho')) {
      found = true;
      console.log(`\n✅ Encontrado: ${nome}`);
      console.log(`TD[1] HTML (primeiros 800 chars):`);
      console.log($td1.html()?.substring(0, 800));
      console.log(`\nTD[1] Texto:`);
      console.log($td1.text());
      
      console.log('\n\nPosições encontradas:');
      $td1.find('span.pos').each((i, span) => {
        console.log(`- ${$(span).text()}`);
      });
    }
  });
  
  if (!found) {
    console.log('❌ Pacho não encontrado na página');
  }
  
} catch (error) {
  console.error('Erro:', error.message);
}
