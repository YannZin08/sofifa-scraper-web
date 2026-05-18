import axios from 'axios';
import { load } from 'cheerio';

async function searchPacho(offset) {
  const url = `https://api.scraperapi.com?api_key=8e6655aedf69b0dbf991faead8a59508&url=https://sofifa.com/players?type=all&lg%5B%5D=16&offset=${offset}`;
  
  try {
    const response = await axios.get(url, { timeout: 45000 });
    const html = response.data;
    const $ = load(html);
    
    let found = false;
    $('tbody tr').each((idx, row) => {
      const $row = $(row);
      const $cells = $row.find('td');
      const $td1 = $cells.eq(1);
      const nome = $td1.find('a[href*="/player/"]').first().text().trim();
      
      if (nome.toLowerCase().includes('pacho')) {
        found = true;
        console.log(`\n✅ ENCONTRADO em offset ${offset}: ${nome}`);
        console.log(`\nTD[1] HTML:`);
        console.log($td1.html());
        console.log(`\nTD[1] Texto:`);
        console.log($td1.text());
        
        console.log('\n\nPosições (span.pos):');
        $td1.find('span.pos').each((i, span) => {
          console.log(`- ${$(span).text()}`);
        });
      }
    });
    
    return found;
  } catch (error) {
    console.error(`Erro ao buscar offset ${offset}:`, error.message);
    return false;
  }
}

console.log('Procurando por Pacho em todos os offsets...\n');
for (let offset = 0; offset <= 480; offset += 80) {
  const found = await searchPacho(offset);
  if (found) break;
  console.log(`Offset ${offset}: não encontrado`);
  // Delay entre requisições
  await new Promise(r => setTimeout(r, 2000));
}
