import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16';
const apiKey = '8e6655aedf69b0dbf991faead8a59508';

console.log('🔍 Testando extração de todas as 15 páginas...');
console.log(`URL: ${url}`);
console.log('Offsets: 0-1200 (15 páginas x 80 jogadores)\n');

try {
  const startTime = Date.now();
  const players = await scrapeSofifaPlayersBatch(url, 0, 1200, apiKey);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`✅ Extração concluída em ${duration}s`);
  console.log(`📊 Total de jogadores: ${players.length}`);
  
  if (players.length > 0) {
    console.log('\n📋 Primeiros 3 jogadores:');
    players.slice(0, 3).forEach((p, i) => {
      console.log(`${i+1}. ${p.name} - ${p.positions} (Overall: ${p.overall})`);
    });
  }
  
  // Verificar distribuição por página
  const pagesWithData = Math.ceil(players.length / 80);
  console.log(`\n📄 Páginas com dados: ${pagesWithData} de 15`);
  
} catch (error) {
  console.error('❌ Erro na extração:', error.message);
  if (error.response?.status) {
    console.error(`Status HTTP: ${error.response.status}`);
  }
}
