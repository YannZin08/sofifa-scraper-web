import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const url = 'https://sofifa.com/players?type=all&lg%5B%5D=16';

console.log('🔍 Teste final CORRETO de extração\n');
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
    console.log('\n📋 Primeiros 5 jogadores:');
    result.players.slice(0, 5).forEach((p, i) => {
      const pos = Array.isArray(p.posicoes) ? p.posicoes.join('/') : p.posicoes;
      console.log(`${i+1}. ${p.nome} - ${pos} (Overall: ${p.overall})`);
    });
    
    console.log('\n📋 Últimos 3 jogadores:');
    result.players.slice(-3).forEach((p, i) => {
      const pos = Array.isArray(p.posicoes) ? p.posicoes.join('/') : p.posicoes;
      console.log(`${result.players.length - 2 + i}. ${p.nome} - ${pos} (Overall: ${p.overall})`);
    });
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
