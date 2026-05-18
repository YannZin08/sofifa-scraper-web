import axios from 'axios';
import { load } from 'cheerio';

// Pacho está no offset 480 (página 7)
const url = 'https://api.scraperapi.com?api_key=8e6655aedf69b0dbf991faead8a59508&url=https://sofifa.com/players?type=all&lg%5B%5D=16&offset=480';

try {
  console.log('Fetching Pacho (offset 480)...');
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
    
    if (nome.includes('Pacho') || nome.includes('pacho')) {
      found = true;
      console.log(`\n✅ Encontrado: ${nome}`);
      console.log(`\nTD[1] HTML completo:`);
      console.log($td1.html());
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
    console.log('\nPrimeiros 5 jogadores:');
    let count = 0;
    $('tbody tr').each((idx, row) => {
      if (count >= 5) return;
      const $row = $(row);
      const $cells = $row.find('td');
      const $td1 = $cells.eq(1);
      const nome = $td1.find('a[href*="/player/"]').first().text().trim();
      if (nome) {
        console.log(`${count+1}. ${nome}`);
        count++;
      }
    });
  }
  
} catch (error) {
  console.error('Erro:', error.message);
}
