import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16';

console.log('🔍 Teste final de extração com tratamento de páginas vazias\n');
console.log(`URL: ${url}\n`);

try {
  const startTime = Date.now();
  const result = await scrapeSofifaPlayersBatch(url, 0, 1200, 80);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Extração concluída em ${duration}s`);
  console.log(`📊 Sucesso: ${result.success}`);
  console.log(`📊 Total de jogadores: ${result.count || result.players.length}`);
  
  if (result.error) {
    console.log(`⚠️  Erro: ${result.error}`);
  }
  
  if (result.players && result.players.length > 0) {
    console.log('\n📋 Primeiros 3 jogadores:');
    result.players.slice(0, 3).forEach((p, i) => {
      console.log(`${i+1}. ${p.name} - ${p.positions} (Overall: ${p.overall})`);
    });
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
