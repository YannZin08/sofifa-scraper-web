import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16';
const apiKey = '8e6655aedf69b0dbf991faead8a59508';

console.log('🔍 Testando extração de todas as 15 páginas...');
console.log(`URL: ${url}`);
console.log('Offsets: 0-1200 (15 páginas x 80 jogadores)\n');

try {
  const startTime = Date.now();
  // Step de 80 = 15 páginas (0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 880, 960, 1040, 1120)
  const result = await scrapeSofifaPlayersBatch(url, 0, 1200, 80);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Extração concluída em ${duration}s`);
  console.log(`📊 Sucesso: ${result.success}`);
  console.log(`📊 Total de jogadores: ${result.count || result.players.length}`);
  
  if (result.error) {
    console.log(`⚠️  Erro: ${result.error}`);
  }
  
  if (result.players && result.players.length > 0) {
    console.log('\n📋 Primeiros 5 jogadores:');
    result.players.slice(0, 5).forEach((p, i) => {
      console.log(`${i+1}. ${p.name} - ${p.positions} (Overall: ${p.overall}, Potencial: ${p.potencial})`);
    });
    
    console.log('\n📋 Últimos 3 jogadores:');
    result.players.slice(-3).forEach((p, i) => {
      console.log(`${result.players.length - 2 + i}. ${p.name} - ${p.positions} (Overall: ${p.overall})`);
    });
  }
  
  // Verificar distribuição por página
  const pagesWithData = Math.ceil((result.players.length || 0) / 80);
  console.log(`\n📄 Páginas com dados: ${pagesWithData} de 15`);
  
} catch (error) {
  console.error('❌ Erro na extração:', error.message);
  console.error(error);
}
