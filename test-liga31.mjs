import { scrapeSofifaPlayersBatch } from './server/scraperService.ts';

const url = 'https://sofifa.com/players?type=all&lg%5B%5D=31';
console.log('🧪 Teste Liga 31 - 1 página\n');

try {
  const result = await scrapeSofifaPlayersBatch(url, 0, 0, 1);
  
  if (result.success && result.players) {
    console.log(`✅ ${result.players.length} jogadores extraídos\n`);
    console.log('Primeiros 5:');
    result.players.slice(0, 5).forEach((p, i) => {
      console.log(`${i+1}. ${p.nome} (${p.overall}) - ${p.pais} - ${p.posicoes.join('/')}`);
    });
  } else {
    console.log(`❌ Erro: ${result.error}`);
  }
} catch (error) {
  console.error('❌ Erro:', error.message);
}
