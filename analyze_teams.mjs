import { load } from 'cheerio';
import axios from 'axios';

async function fetchPageWithRetry(url, maxRetries = 8) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(url, { headers, timeout: 30000 });
      return response.data;
    } catch (error) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.log(`Tentativa ${attempt + 1}/${maxRetries} falhou. Aguardando ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Falha ao buscar página após ${maxRetries} tentativas`);
}

async function analyzeTeamsPage() {
  try {
    const url = 'https://sofifa.com/teams?type=all&lg%5B%5D=4';
    
    console.log('Buscando página de times...');
    const html = await fetchPageWithRetry(url);
    
    const $ = load(html);
    
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
        console.log(`  Texto: ${$cell.text().trim().substring(0, 150)}`);
        console.log(`  HTML: ${$cell.html().substring(0, 300)}`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

analyzeTeamsPage();
